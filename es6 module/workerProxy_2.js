const _ = window._;
const WorkerClass = {};

WorkerClass.GModules = {};

export { WorkerClass };

let WORKER_UID = 0;

// 抽象類
class WorkerProxy {
    // employment: 是否是僱員
    constructor(manager, employment) {

        this._;

        this.manager = manager;

        // _的路徑
        this.sourceScriptPath;

        // _extension1 的路徑
        this.extension1Path;

        // 非正職 worker 當沒工作可接時
        // 會閒置等待多久
        this.idleTime;

        // worker 本體的位置
        this.workerUrl;

        // 需要被 worker 導入的 scripts
        this.importScriptList = [];
        //------------------
        this.id = WORKER_UID++;

        // 當前接的任務
        this.job;

        // worker 本體
        this.worker;

        this.timeHandle;
        //------------------
        // 接工作嗎
        this.flag_busy = false;

        // 初始化了沒
        // 主要在 inportScripts
        this.flag_inited = false;

        // 是否是正職者
        this.employment = !!employment;
        //------------------
        //callback
        this.event_end;

        // callback
        this.event_error;
        //------------------

        this._init();
    }
    //----------------------------------------------------------
    _init() {
        this._getSettings();

        this.initWorker();
    }
    //----------------------------------------------------------
    _getSettings() {
        // debugger;

        this._ = this.manager._;

        const info = _.$extension1.info;
        const settings = this.manager.settings;

        // sourceScriptPath
        this.sourceScriptPath = settings.sourceScriptPath;

        // extensionPath1
        this.extension1Path = settings.extension1ScriptPath;

        this.importScriptList = settings.importScriptList.slice();

        if (this.extension1Path) {
            this.importScriptList.unshift(this.extension1Path);
        } else {
            throw new TypeError('no _extension1 path');
        }

        if (this.sourceScriptPath) {
            this.importScriptList.unshift(this.sourceScriptPath);
        } else {
            throw new TypeError('no set _.path');
        }
    }
    //----------------------------------------------------------
    initWorker() {
        console.log('manager 僱傭 new worker(%s), 是正職者嗎(%s)', this.id, this.employment);

        // 登錄
        this.manager.addWorker(this);

        this._initWorker();
    }

    // @override
    _initWorker() {
        throw new Error('need override _initWorker');

        // 取得本體內容
        // 實例化
        // 連接事件
    }

    //----------------------------------------------------------
    // API
    // CEO 請他接下一個任務
    takeJob_callByManager() {
        debugger;

        // reset
        let job = this.jobList.pop();

        if (this.timeHandle) {
            // 臨時僱員，正在閒置中

            console.log('worker(%s)正在 idle，被 manager 叫來接工作', this.id);

            clearTimeout(this.timeHandle);
            this.timeHandle = undefined;
        } else {
            // 正職員工
            console.log('mananger 指派正職 worker(%s)接工作', this.id);
        }

        // 執行任務
        this._doJob(job);
    };
    //------------------------------------------------------------------
    // API
    takeJob_callBySelf() {
        debugger;

        console.log('worker(%s)自己檢查是否有工作可拿', this.id);

        // 檢查是否有任務
        let job = this.manager.getJob_callByWorker();

        if (job == null) {

            if (this.employment) {
                console.log('沒工作可拿，正職 worker(%s)，等待', this.id);
            } else {
                console.log('沒工作可拿，兼職 worker(%s)沒工作，進入 idle', this.id)
                this._idle();
            }
        } else {

            // 執行任務
            this._doJob(job);
        }
    }
    //------------------------------------------------------------------
    terminate() {
        console.log('worker(%s) will terminate', this.id);

        let w_info = this.manager.getAllworkersInfo();

        console.log(JSON.stringify(w_info));

        let all = w_info.all;
        let idle = w_info.idle;

        let busyCount = all.length - idle.length;
        //------------------
        // 只剩一個人沒事做
        let judge_1 = (idle.length == 1);

        // 有人正在忙
        let judge_2 = busyCount > 0;

        // 沒事做的就是我
        let judge_3 = idle.includes(this.id);

        if (judge_1 && judge_2 && judge_3) {
            // 大家都在忙，只剩我一個人有空
            // 不要終結自己，等待工作
            // 當事情很多時
            // 多出一個閒置的 worker 在等待接工作
            console.log('worker(%s) 大家都在忙，有空的只剩我一個人，暫時不離職，再進入 idle 等工作', this.id);
            this._idle();
            return;
        }
        //-----------------------
        console.log("worker(%s) 離職", this.id);
        this.manager.removeWorker(this, false);

        this.closeWorker();
    }
    //------------------------------------------------------------------
    // @override
    closeWorker() {
        throw new Error('need override workerProxy.closeWorker()');
    }
    //------------------------------------------------------------------
    // 離職，因為執行的任務作廢
    leave() {
        console.log("worker(%s) 的任務過時", this.id);

        // 把 worker 移除登錄表
        this.manager.removeWorker(this.worker, false);

        // 結束這個 worker
        this.closeWorker();

        // 請 manager 再招人遞補
        this.manager.addNewWorker_callBy_sacked();
    }
    //------------------------------------------------------------------
    // 執行任務
    _doJob(job) {
        this.flag_busy = true;

        this.job = job;
        // debugger;

        // 取得任務內容
        let command = this.job.getCommand2Worker();
        command.id = this.id;

        // 通知 job 任務開始執行
        this.job.start(this);

        // 請 worker 工作
        this.worker.postMessage(command);
    };
    //------------------------------------------------------------------
    // 進入 idle 狀態
    // 若已在 idle 狀態中，就不動作
    _idle() {
        // this.waitDeadth = true;
        debugger;

        const idleTime = this.manager.settings.idleTime;

        console.log('worker(%s)進入 idle(%sms)', this.id, idleTime);

        let $this = this;

        this.timeHandle = setTimeout(function () {
            $this.timeHandle = undefined;
            $this.terminate();
        }, idleTime);
    }
    //------------------------------------------------------------------
    isBusy() {
        // 初始化
        // 接工作
        // 都當是 busy
        // 無法接工作
        return (!this.flag_inited || this.flag_busy);
    }
    //------------------------------------------------------------------
    // @override
    _event_getEndEvent() {
        throw new Error('need override _event_getEndEvent');
    }
    //------------------------------------------------------------------
    // @override
    _event_getErrorEvent() {
        throw new Error('need override _event_getErrorEvent');
    }
}
//==============================================================================
// browser 環境用下用的 worker
class WebWorkerProxy extends WorkerProxy {
    constructor(manager, employment) {
        super(manager, employment);
    }
    //----------------------------------------------------------
    // @override
    closeWorker() {
        console.log("worker(%s)終止", this.id);

        this.worker.removeEventListener('message', this._event_getEndEvent());
        this.worker.removeEventListener('error', this._event_getErrorEvent());

        this.worker.terminate();
        this.worker = undefined;
    }
    //----------------------------------------------------------
    _getWorkerUrl() {
        // debugger;

        let workerContent;

        if (WorkerProxy.workerContent == null) {

            let fn = this.getWorkerFnContent();

            workerContent = fn.toString();

            // console.log(workerContent);

            let reg = /^[^{]+\{([\s\S]*)\}/;
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

        return URL.createObjectURL(bb);
    }
    //----------------------------------------------------------
    // @override
    _initWorker() {
        // debugger;

        console.log('新進員工準備中，是正職嗎(%s)', this.employment);

        // 取得本體
        this.workerUrl = this._getWorkerUrl();

        this.worker = new Worker(this.workerUrl);

        this.worker.addEventListener('error', this._event_getErrorEvent());
        this.worker.addEventListener('message', this._event_getEndEvent());
    }
    //----------------------------------------------------------
    // @override
    _event_getEndEvent() {

        if (this.event_end == null) {
            // worker 工作完會呼叫此
            this.event_end = (function (e) {

                if (!this.manager.workers.has(this)) {
                    // 被解僱了
                    this.closeWorker();
                    return;
                }
                //-----------------------

                // debugger;

                this.flag_busy = false;
                let data = e.data || {};
                let res;

                if (this.flag_inited) {
                    // worker 已經初始化過

                    if (this.job) {
                        // 等待 worker 的工作完成
                        console.log('worker(%s) job finished', this.id);

                        let job = this.job;
                        this.job = undefined;
                        job.resolve(data.res);
                    }

                } else {
                    // worker 尚在初始化中
                    if (this.job) {
                        throw new Error(`worker(${this.id}) get job but not initialize yet`);
                    }

                    if (data.initialized != null && data.initialized) {
                        // worker 傳來初始化的消息
                        console.log('新員工(%s)準備好了', this.id);
                        this.flag_inited = true;
                    }
                }

                this.takeJob_callBySelf();
            }).bind(this);
        }

        return this.event_end;
    }
    //----------------------------------------------------------
    // @override
    _event_getErrorEvent() {

        if (this.event_error == null) {
            // worker error 完會呼叫此
            this.event_error = (function (e) {

                if (!this.manager.workers.has(this)) {
                    // 被解僱了
                    this.closeWorker();
                    return;
                }

                //-----------------------
                let job = this.job;
                this.job = undefined;
                this.flag_busy = false;

                if (job) {
                    // 等待 worker 的工作錯誤
                    job.reject(e);
                }

                console.log('worker(%s) error', this.id);

                // 如何處理發生錯誤
                this.takeJob_callBySelf();

            }).bind(this);
        }
        return this.event_error;
    }
    //----------------------------------------------------------
    // worker 的內文
    getWorkerFnContent() {
        return function () {
            ////////////////////////////////////////////////////////////////////
            //
            // _.worker() 本體
            //
            ////////////////////////////////////////////////////////////////////
            debugger;

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
                let args = data.args;
                let fnArgs = data.fnArgs

                let id = data.id;
                let jobID = data.jobID;

                //----------------------------
                // console.log('*********** in worker env >> worker(%s) start job(%s)', id, jobID);

                if ($_ == null) {
                    throw new Error('(lodash|underscore) load error');
                }
                // worker 接運算任務
                // debugger;

                if (typeof $_[command] != 'function') {
                    throw new TypeError('_ no this function');
                }
                // debugger;

                //----------------------------
                // 處理是函式的參數
                for (let i = 0; i < args.length; i++) {
                    debugger;

                    let arg = args[i];
                    let fnArg = fnArgs[i];

                    if (arg == null && fnArg != null) {
                        args[i] = getFunction(fnArg);
                    }
                }
                //----------------------------
                // _ 的運算
                let res = $_[command].apply($_, args);
                //----------------------------

                if (res instanceof Promise) {
                    res.then(function () {
                        forTest(res, true);
                    });

                    res.catch(function (e) {
                        let err;

                        if (!(e instanceof Error)) {
                            err = new Error(e);
                        }
                        throw err;
                    });

                } else {
                    forTest(res, true);
                }
            });
            //================================================

            // 通知已初始化完畢
            self.postMessage({
                initialized: true
            });
            //================================================

            function forTest(res, test) {

                if (test) {
                    setTimeout(function () {
                        // console.log('*********** in worker env >> worker(%s) finish job(%s)', id, jobID);
                        console.log('---------------');
                        self.postMessage({
                            res: res
                        });
                    }, 1000);
                } else {
                    // console.log('*********** in worker env >> worker(%s) finish job(%s)', id, jobID);
                    console.log('---------------');
                    self.postMessage({
                        res: res
                    });
                }
            }
            //----------------------------
            function getFunction(info) {
                debugger;

                let args = info.args;
                let fnContext = info.fnContext;

                args.push(fnContext);

                args = args.map(function (arg) {
                    return JSON.stringify(arg);
                });

                args = args.join(",");

                let fnContext_1 = `
                'use strict'
                let fn = new Function(${args});
                return fn;`;

                let factory = new Function(fnContext_1);

                let fn = factory();

                return fn;
            }
        }
    }
}

WorkerClass['WebWorkerProxy'] = WebWorkerProxy;
//==============================================================================
// node.js 環境下用的 worker
class NodeJsWorkerProxy extends WorkerProxy {
    constructor(manager, employment) {
        super(manager, employment);
    }
    //----------------------------------------------------------
    _getWorkerUrl() {
        let $extension1_path = this._.$extension1.info.extension1ScriptPath;

        // 返回 worker 的 realPath
        // 必須在 extension 目錄下 /worker/worker 放置 nodeJsWorker.js 檔
        this.workerUrl = $extension1_path + '/worker/worker/nodeJsWorker.js';
    }
    //----------------------------------------------------------
    _initWorker() {
        super._initWorker();

        const importScriptList = this.importScriptList;

        this.worker = new Worker(this.workerUrl, {
            workerData: {
                importScriptList: importScriptList
            }
        });

        this.worker.on('error', this._event_getErrorEvent());
        this.worker.on('message', this._event_getEndEvent());

    }
    //----------------------------------------------------------
    _event_getEndEvent() {
    }
    //----------------------------------------------------------
    _event_getErrorEvent() {

    }
}
WorkerClass['NodeJsWorkerProxy'] = NodeJsWorkerProxy;
