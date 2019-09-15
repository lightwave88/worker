
import { WorkerClass } from './workerProxy_2.js';
import { WorkerJob } from './WorkerJob_1.js';

///////////////////////////////////////////////////////////////////////////////
//
// 整合所有的 worker
//
///////////////////////////////////////////////////////////////////////////////

class WorkerManager {

    // WorkerManager 只能有單例
    static get_instance(workerCommand) {
        if (WorkerManager.instance == null) {
            WorkerManager.instance = new WorkerManager(workerCommand);
        }
        return WorkerManager.instance;
    }
    //------------------------------------------------------------------
    constructor() {

        // 與外界橋接的橋樑
        this.root;

        //
        this._;

        this.settings;

        this.environment;

        // 記錄有多少在線的 worker
        this.workers = new Set();

        // 正在閒置中的 workers(等死中)
        // this.idleWorks = new Set();
        this.jobList = [];

        // 因應各種環境引入不同的 worker
        // 一個重要的設計點
        this.workerClass;

        //-----------------------
        this._getSettings();
    }
    //------------------------------------------------------------------
    _getSettings() {
        debugger;

        this.root = WorkerManager.GModules["root"];

        this.settings = this.root.GModules["workerSettings"];

        this._ = this.root.GModules["_"];

        if (this._ == null) {
            throw new Error('no import _');
            // console.log('no connection with _');
        }

        if (this._.$extension1 == null) {
            throw new Error("need import _extension1");
        }

        // 取得環境
        this.environment = this._.$extension1.info.environment;

        //-----------------------
        // 取得適合當前環境下的 workerClass

        switch (this.environment) {
            case "nodejs":
                this.workerClass = WorkerClass.NodeJsWorkerProxy;
                break;
            default:
                this.workerClass = WorkerClass.WebWorkerProxy;
                break;
        }
    }
    //------------------------------------------------------------------
    // args: 使用者下的命令
    addJob(commandArgs, jobOptions) {
        // debugger;
        // console.log('--------------');
        console.log('WorkerManager > 加入新工作');

        let job = new WorkerJob(this, commandArgs, jobOptions);

        // 把任務加入
        this.jobList.unshift(job);
        //----------------------------
        // 檢查是否有 idle worker
        this.assignJob();

        return job.promise();
    }
    //------------------------------------------------------------------
    getJobs() {
        return this.jobList;
    }
    //------------------------------------------------------------------
    // 預先不會在一開始啟動 workers
    // 通常只有在有指令後才會有 workers 待命
    // 不過可以事先就請 workers 待命
    initWorkers(count) {
        debugger;

        const min_workers = this.settings.min_workers;
        const max_workers = this.settings.max_workers;

        if (count > max_workers) {
            throw new Error(`initWorkers.count > max_workers(${max_workers})`);
        }

        for (let i = 0; i < count; i++) {
            debugger;

            if (this.workers.size >= max_workers) {
                break;
            }

            let employment = this._checkEmployStatus();

            new this.workerClass(this, employment);
        }
    }
    //------------------------------------------------------------------
    // 針對 node.js
    terminateAllWorkers() {
        this.workers.forEach(function (w) {
            this.removeWorker(w, true);
        }, this);
    }
    //------------------------------------------------------------------
    // 分派任務
    // 把任務交給 worker 去辦
    assignJob() {
        console.log('manager assignJob');
        //-----------------------

        while (this.jobList.length > 0) {

            console.log('still have jobs(%s)', this.jobList.length);

            // 盡可能招募 worker 來接工作
            let w = this._findIdleWorker();

            if (w) {
                w.takeJob_callByManager();
            } else {
                // 若找不到可用的 worker 作罷
                break;
            }
        }
    }
    //------------------------------------------------------------------
    // 新增 worker(由 worker 自己通報)
    addWorker(workerProxy) {
        this.workers.add(workerProxy);
    }
    //------------------------------------------------------------------
    // 移除指定的 worker(由 worker 自己通報)
    removeWorker(workerProxy, close) {
        this.workers.delete(workerProxy);

        if (close) {
            this.workers.closeWorker();
        }
    }
    //------------------------------------------------------------------
    // worker 想取得 job
    getJob_callByWorker = function () {
        let job = null;

        console.log('有(%s)項工作待領', this.jobList.length);

        if (this.jobList.length > 0) {
            job = this.jobList.pop();
        }

        return job;
    }
    //------------------------------------------------------------------
    // 檢查是否有空閒的 worker
    _findIdleWorker() {
        // debugger;

        console.log('manager find worker');

        const max_workers = this.settings.max_workers;
        // const min_workers = this.settings.min_workers;

        // 找尋空閒中的 worker
        let idleWork = this._findExistedIdleWorker();

        if (idleWork != null) {
            return idleWork;
        }
        //----------------------------

        // 沒有空閒中的 worker
        if (this.workers.size < max_workers) {
            // 沒有閒置的 worker
            // 但已有的 worker 數量尚未達上限

            // 檢查 employment 狀態
            let employment = this._checkEmployStatus();

            // console.log(`manager employment new worker(employment: ${employment})`);

            new this.workerClass(this, employment);

        } else {
            console.log('manager no find worker');
        }
    }
    //------------------------------------------------------------------
    // 檢查 employ 狀態
    _checkEmployStatus() {
        const min_workers = this.settings.min_workers;

        let info = this.getAllworkersInfo();
        let employ = info.employ;

        if (employ.length < min_workers) {
            return true;
        }
        return false;
    }
    //------------------------------------------------------------------
    // 找出閒置中的 worker
    _findExistedIdleWorker() {
        let workers = Array.from(this.workers);
        let worker = null;

        let _workerList = [];

        let res = workers.some(function (w) {
            if (!w.isBusy()) {

                if (w.employment) {
                    worker = w;
                    return true;
                } else {
                    _workerList.push(w);
                }
            }
        });

        if (!res && _workerList.length) {
            worker = _workerList[0];
        }

        if(_workerList.length){
            _workerList.length = 0;
        }
        _workerList = undefined;

        return worker;
    }
    //------------------------------------------------------------------
    // 有 worker 被解僱，就再找新的進來
    addNewWorker_callBy_sacked() {

        console.log("有員工被解僱，招募新的員工");

        // 沒有空閒中的 worker
        if (this.workers.size >= max_workers) {
            console.log("已達最大員工數，不再招募");
            return;
        }
        // 沒有閒置的 worker
        // 但已有的 worker 數量尚未達上限

        // 檢查 employment 狀態
        let employment = this._checkEmployStatus();

        new this.workerClass(this, employment);
    }
    //------------------------------------------------------------------
    // 取得需要的資訊
    getAllworkersInfo() {
        let all = [];
        let idle = [];
        let employ = [];

        this.workers.forEach(function (w) {
            all.push(w.id);

            if (!w.isBusy()) {
                idle.push(w.id);
            }

            if (w.employment) {
                employ.push(w.id);
            }
        });

        let jobCount = this.jobList.length;
        //----------------
        return {
            all: all,
            idle: idle,
            jobCount: jobCount,
            employ: employ,
        }
    }
    //------------------------------------------------------------------
}

WorkerManager.instance;

//=============================================================================
WorkerClass.GModules["WorkerManager"] = WorkerManager;
WorkerJob.GModules["WorkerManager"] = WorkerManager;

WorkerManager.GModules = {};

export { WorkerManager };
