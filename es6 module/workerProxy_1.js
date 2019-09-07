const _ = window._;

import { workerSettings } from './settings_1.js';

let WORKER_UID = 0;

class WorkerProxy {
    constructor(manager, employment) {

        this.fn = WorkerProxy;

        this.manager = manager;

        this.sourceScriptPath;

        this.extension1Path;

        this.idleTime;

        this.workerUrl;

        // 需要被 worker 導入的 scripts
        this.importScriptList = [];
        //------------------
        this.id = WORKER_UID++;

        // 當前任務
        this.job;

        // worker
        this.worker;

        this.timeHandle;
        //------------------
        this.flag_busy = false;

        // 旗標
        this.flag_inited = false;

        // 是否是正職者
        this.employment = !!employment;

        this.flag_waitCount = 0;

        //------------------
        this.event_end;
        this.event_error;
        //------------------
        this._getSettings();

        this._getWorkerUrl();

        this._initWorker();
    }

    _getSettings() {
        const $i = _.$extension1.info;
        const $s = workerSettings;

        // sourceScriptPath
        this.sourceScriptPath = $s.sourceScriptPath || $i.sourceScriptPath;

        // extensionPath1
        this.extension1Path = $s.extension1ScriptPath || $i.extension1ScriptPath;

        if (typeof $s.idleTime == 'number' && $s.idleTime >= 0) {
            this.idleTime = $s.idleTime;
        } else {
            throw new TypeError("idleTime set error");
        }

        if (!this.sourceScriptPath) {
            throw new TypeError('no set (lodash|underscore) url');
        }

        if (!this.extension1Path) {
            throw new TypeError('no set extension1Path');
        }

        this.importScriptList.push(this.sourceScriptPath);
        this.importScriptList.push(this.extension1Path);

        this.importScriptList = this.importScriptList.concat($s.importScriptList);
    }

    _getWorkerUrl() {

        let workerContent;

        if (WorkerProxy.workerContent == null) {

            let fn = this.fn.getWorkerFnContent();

            workerContent = fn.toString();

            // console.log(workerContent);

            let reg = /^[^{]+\{([\s\S]*)\}[^}]*$/;
            let res = reg.exec(workerContent);
            workerContent = res[1];

            WorkerProxy.workerContent = workerContent;
        } else {
            workerContent = WorkerProxy.workerContent;
        }

        // 注入 importScriptList

        let scriptList = JSON.stringify(this.importScriptList);

        workerContent = `const scriptList = ${scriptList};
        ${workerContent}`;

        // console.log(workerContent);

        let bb = new Blob([workerContent]);

        this.workerUrl = URL.createObjectURL(bb);
    }

    _initWorker() {
        this.manager.addWorker(this);

        console.log("<<worker(%s) init>>", this.id);

        this.worker = new Worker(this.workerUrl);

        this.worker.addEventListener('error', this._event_getErrorEvent());
        this.worker.addEventListener('message', this._event_getEndEvent());

    }
    //------------------------------------------------------------------
    // CEO 請他接下一個任務
    takeJob_callByManager(job) {
        // debugger;

        console.log('manager 指派工作給 worker(%s)', this.id);

        // reset
        this.flag_waitCount = 0;

        if (this.timeHandle) {

            // this.waitDeadth = false;

            console.log('worker(%s)正在 idle，被叫起來接工作', this.id);
            // 若正在閒置中
            clearTimeout(this.timeHandle);
            this.timeHandle = undefined;
        }

        console.log('worker(%s)接工作', this.id);

        // 非同步
        // 執行任務
        this._doJob(job);

        // 是否還有多的工作
        // 若有再看能否多請人來接
        // this.manager.noticeWorkers_checkJob(this);

    };
    //------------------------------------------------------------------
    takeJob_callBySelf() {
        // debugger;

        console.log('worker(%s)自己檢查是否有工作可拿', this.id);

        // 檢查是否有任務
        let job = this.manager.getJob_callByWorker();

        if (job == null) {

            if (this.employment) {
                console.log('正職 worker(%s)沒工作，等待', this.id);
            } else {
                console.log('兼職 worker(%s)沒工作，進入 idle', this.id)
                this._idle();
            }
        } else {
            console.log('worker(%s)接 job(%s)', this.id, job.id);

            // 非同步
            // 執行任務
            this._doJob(job);

            // 是否還有多的工作
            // 若有再看能否多請人來接
            // this.manager.noticeWorkers_checkJob(this);
        }
    }
    //------------------------------------------------------------------
    // 執行任務
    _doJob(job) {
        this.flag_busy = true;

        this.job = job;
        // debugger;

        let command = this.job.getCommand();
        command.id = this.id;

        console.log('worker(%s)發出任務 job(%s)', this.id, this.job.id);

        // 請 worker 工作
        this.worker.postMessage(command);
    };
    //------------------------------------------------------------------
    // 進入 idle 狀態
    // 若已在 idle 狀態中，就不動作
    _idle() {
        // this.waitDeadth = true;

        console.log('worker(%s)進入 idle', this.id);

        if (this.timeHandle) {
            clearTimeout(this.timeHandle);
            this.timeHandle = undefined;
            console.log('worker(%s)問題點', this.id);

        }
        let $this = this;

        this.timeHandle = setTimeout(function () {
            $this.timeHandle = undefined;
            $this._terminate();
        }, workerSettings.idleTime);
    }
    //------------------------------------------------------------------
    _terminate() {

        console.log('worker(%s) will terminate', this.id);

        let wInfo = this.manager.getAllworkersInfo();

        console.log(JSON.stringify(wInfo));

        if (wInfo.busy > 0 && wInfo.idle < 2) {
            // 大家都在忙，只剩我一個人有空
            // 不要終結自己，等待工作
            // 當事情很多時
            // 多出一個閒置的 worker 在等待接工作
            console.log('worker(%s) 大家都在忙，有空的只剩我一個人，在加班一下，再進入 idle 等工作', this.id);
            this._idle();
            return;
        }
        //-----------------------

        // 若有不少人都在閒置中

        if (this.manager.workers.size == 1) {
            // 公司都沒請正職人員

            console.log('worker(%s) 只剩俺一個人，再多等些時間，進入 idle', this.id);
            console.log('worker(%s) 已經 idle(%s)幾次', this.id, this.flag_waitCount);

            if (this.flag_waitCount++ < 8) {

                console.log();

                this._idle();
                return;
            } else {
                console.log('worker(%s) 獨自一人太久了，再見')
            }
        }
        //-----------------------
        console.log("worker(%s) terminate", this.id);
        this.worker.removeEventListener('message', this._event_getEndEvent());
        this.worker.removeEventListener('error', this._event_getErrorEvent());

        this.manager.removeWorker(this);
        this.worker.terminate();
        this.worker = undefined;
        this.id = undefined;
        this.fn = undefined;
        this.job = undefined;
        this.manager = undefined;
    }

    //------------------------------------------------------------------
    isReady2TakeJob() {
        return (this.flag_inited && !this.flag_busy);
    }

    isBusy() {
        return (!this.flag_inited || this.flag_busy);
    }
    //------------------------------------------------------------------
    _event_getEndEvent() {

        if (this.event_end == null) {
            // worker 工作完會呼叫此
            this.event_end = (function (e) {
                // debugger;

                this.flag_busy = false;
                //----------------------------
                let data = e.data || {};
                let res;

                if (this.flag_inited) {

                    if (this.job) {
                        // 等待 worker 的工作完成
                        console.log('worker(%s) job finished', this.id);

                        let job = this.job;
                        this.job = undefined;
                        job.resolve(data.res);
                    }

                } else {

                    if (this.job) {
                        throw new Error(`worker(${this.id}) get job but not initialize yet`);
                    }

                    if (data.initialized != null && data.initialized) {
                        console.log('<<worker(%s) initializes>>', this.id);
                        this.flag_inited = true;
                    }
                }

                this.takeJob_callBySelf();
            }).bind(this);
        }

        return this.event_end;
    }
    //------------------------------------------------------------------
    _event_getErrorEvent() {

        if (this.event_error == null) {
            // worker error 完會呼叫此
            this.event_error = (function (e) {
                let job = this.job;
                this.job = undefined;
                this.flag_busy = false;

                if (job) {
                    // 等待 worker 的工作錯誤
                    job.reject(e);
                }

                console.log('worker(%s) error', this.id);

                this.takeJob_callBySelf();

            }).bind(this);
        }
        return this.event_error;
    }
    //------------------------------------------------------------------
    // worker 的內文
    static getWorkerFnContent() {
        return function () {
            ////////////////////////////////////////////////////////////////////////////////
            //
            // _.worker() 本體
            //
            ////////////////////////////////////////////////////////////////////////////////
            // debugger;

            // console.log('i am worker');

            // console.log('href=(%s)', location.href);

            // here
            // let scriptList = "@@_scriptList_@@";


            scriptList.forEach(function (scriptPath) {
                try {
                    importScripts(scriptPath);
                } catch (error) {
                    throw new Error('script(' + scriptPath + ')  load error');
                }
            });

            if (self._ == null) {
                throw new Error('(lodash|underscore) load error');
            }

            const $_ = self._;
            //================================================
            self.addEventListener('message', function (e) {
                // debugger;

                let data = e.data || {};
                //----------------------------
                // 命令
                let command = data['command'] || '';

                // 參數
                let args = data.args || [];

                let id = data.id;
                let jobID = data.jobID;

                //----------------------------
                console.log('*********** in worker env >> worker(%s) start job(%s)', id, jobID);

                if ($_ == null) {
                    throw new Error('(lodash|underscore) load error');
                } else {
                    // worker 接運算任務
                    // debugger;
                    
                    if (!command && typeof $_[command] != 'function') {
                        throw new TypeError('_ no this function');
                    }
                    // debugger;
                    // _ 的運算
                    let res = $_[command].apply($_, args);
                    //----------------------------
                    forTest(res, true);
                }
                
                function forTest(res, test) {
                    
                    if (test) {
                        setTimeout(function () {
                            console.log('*********** in worker env >> worker(%s) finish job(%s)', id, jobID);
                            console.log('---------------');
                            self.postMessage({
                                res: res
                            });
                        }, 1000);
                    } else {
                        console.log('*********** in worker env >> worker(%s) finish job(%s)', id, jobID);
                        console.log('---------------');
                        self.postMessage({
                            res: res
                        });
                    }
                }
            });


            //================================================

            // 通知已初始化完畢
            self.postMessage({
                initialized: true
            });
        }
    }
}

export { WorkerProxy };
