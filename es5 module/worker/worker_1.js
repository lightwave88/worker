!(function (g) {
    // debugger;
    ////////////////////////////////////////////////////////////////////////////
    //
    // 使用方式
    // _.worker(原本 _ 的命令, 原本的參數...)
    //
    // 參數設定
    // maxWorkers: 同時最多能跑 worker 的數量
    // idleTime: worker 沒工作後多久會被銷毀
    // scriptPath: 告訴 worker _ 的路徑在哪
    // extensionPath: 告訴 worker _.extension1 的路徑在哪
    // workerPath: worker script 的位置
    // setting: 得知所有設定的數值(唯讀)
    //
    ////////////////////////////////////////////////////////////////////////////
    (function () {
        // debugger;

        if (typeof module !== 'undefined' && module.exports) {
            // 暫不支援 node.js
            return;
        } else if (typeof window !== "undefined" && typeof document !== "undefined") {
            // web 環境
            if (g._ != null) {
                normalFactory(g._);
            }

        } else {
            return;
        }
    }());
    //--------------------------------------------------------------------------
    // 相關設定
    const workerSetting = {};

    (function (s) {
        s.max_workers = 2;

        s.idleTime = 30000;

        s.scriptPath;

        s.extensionPath;

        s.workerPath;

        // 需要額外載入的 script
        s.scriptList = [];

    })(workerSetting);
    //--------------------------------------------------------------------------
    function normalFactory(_) {

        // 非 worker 環境
        if (_.worker == null) {
            _.mixin({
                // 返回 promise
                worker: workerCommand
            });
        }
        //======================================================================
        function workerCommand() {
            let args = Array.from(arguments);
            let ceo = WorkerCEO.get_instance();

            // debugger;
            let p = ceo.addJob(args);

            return p;
        }
        //----------------------------
        // 對外的設定
        (function (fn) {

            Object.defineProperty(fn, 'maxWorkers', {
                enumerable: true,
                configurable: true,
                get: function () {
                    return workerSetting.max_workers;
                },
                set: function (count) {
                    count = Math.floor(count);
                    count = Math.abs(count);
                    workerSetting.max_workers = count;
                }
            });
            //------------------
            Object.defineProperty(fn, 'idleTime', {
                enumerable: true,
                configurable: true,
                get: function () {
                    return workerSetting.idleTime;
                },
                set: function (time) {
                    workerSetting.idleTime = time;
                }
            });
            //------------------
            Object.defineProperty(fn, 'scriptPath', {
                enumerable: true,
                configurable: true,
                get: function () {
                    return workerSetting.scriptPath;
                },
                set: function (path) {
                    workerSetting.scriptPath = path;
                }
            });
            //------------------
            Object.defineProperty(fn, 'extensionPath', {
                enumerable: true,
                configurable: true,
                get: function () {
                    return workerSetting.extensionPath;
                },
                set: function (path) {
                    workerSetting.extensionPath = path;
                }
            });
            //------------------
            Object.defineProperty(fn, 'workerPath', {
                enumerable: true,
                configurable: true,
                get: function () {
                    return workerSetting.workerPath;
                },
                set: function (path) {
                    workerSetting.workerPath = path;
                }
            });
            //------------------
            Object.defineProperty(fn, 'setting', {
                enumerable: true,
                configurable: true,
                get: function () {
                    return workerSetting;
                },
                set: function () {

                }
            });
            //------------------
            // worker 必須額外載入的 script
            fn.importScript = function (script) {
                if (typeof (script) != 'string') {
                    throw new TypeError('_.worker.importScript arg must be string');
                }

                workerSetting.scriptList.push(script);
            };
        })(workerCommand);

        //======================================================================
        // 整合者
        function WorkerCEO() {
            // debugger;

            // (lodash|underscode)的位置
            this.scriptPath;

            this.extensionPath;

            // worker.path
            this.workerPath;

            // 最多 worker 的數量
            this.workerCount;

            this.idleTime;

            // 記錄有多少在線的 worker
            this.workers = new Set();

            // 正在閒置中的 workers(等死中)
            // this.idleWorks = new Set();
            this.jobList = [];
            //----------------------------
            this._constructor();
        }
        //----------------------------------------------------------------------
        // 類別方法
        (function (fn) {
            // 單例
            fn.$$instance;
            //----------------------------
            // 取得單例
            fn.get_instance = function () {
                if (fn.$$instance == null) {
                    fn.$$instance = new WorkerCEO();
                }
                return fn.$$instance;
            };
            //----------------------------

            // worker 本體內容
            // 不用再設置另一個 script
            fn.workerContent = function () {
                return function worker_init($this) {
                    ////////////////////////////////////////////////////////////////////////////////
                    //
                    // _.worker() 本體
                    //
                    ////////////////////////////////////////////////////////////////////////////////
                    console.log('i am worker');

                    console.log('href=(%s)', location.href);
                    let $_;

                    self.addEventListener('message', function (e) {
                        // debugger;

                        console.log('---------------');
                        console.log('worker> get web message');

                        let data = e.data || {};
                        //----------------------------
                        let scriptPath = data['scriptPath'] || null;
                        let extensionPath = data["extensionPath"] || null;
                        let command = data['command'] || '';
                        let args = data.args || [];
                        let id = data.id || 0;
                        let scriptList = data['scriptList'] || null;
                        let jobID = data['jobID'] || null;

                        //----------------------------
                        // load _.script
                        if ($_ == null) {
                            // worker 需要初始化
                            console.log('worker(%s)> init', id);

                            scriptList = (scriptList == null) ? [] : (JSON.parse(scriptList));
                            scriptList.unshift(extensionPath);

                            if (scriptPath) {
                                // debugger;
                                console.log('worker(%s)> import script', id);
                                // 初始化
                                try {
                                    importScripts(scriptPath);
                                } catch (error) {
                                    throw new Error('_ (' + scriptPath + ')load error');
                                }

                                $_ = self._;

                                scriptList.forEach(function (_path) {
                                    // debugger;
                                    try {
                                        importScripts(_path);
                                    } catch (error) {
                                        throw new Error('script(' + _path + ')  load error');
                                    }
                                });

                            } else {
                                console.log('worker(%s)> no scriptPath', id);
                            }

                            self.postMessage({});

                        } else {
                            // worker 接運算任務
                            // debugger;
                            console.dir(data);
                            console.log('worker(%s)> do job(%s)', id, jobID);

                            if (!command && typeof $_[command] !== 'function') {
                                throw new TypeError('no assign fun');
                            }
                            // debugger;
                            // _ 的運算
                            let res = $_[command].apply($_, args);
                            //----------------------------

                            test_1().then(function () {
                                self.postMessage({
                                    res: res
                                });
                            });
                        }

                        console.log('---------------');
                    });

                    function test_1() {
                        return new Promise(function (_s, _j) {
                            setTimeout(function () {
                                _s();
                            }, 1000);
                        });
                    }
                }
            };
            //----------------------------

            fn.getWorkerContent = function () {
                let _fn = fn.workerContent();
                let workerContent = _fn.toString();
                workerContent += ';\n worker_init(self);'

                let bb = new Blob([workerContent]);

                return (URL.createObjectURL(bb));
            };
        })(WorkerCEO);
        //----------------------------------------------------------------------
        (function () {
            this._constructor = function () {
                // debugger;
                const $extension = _.extension1();

                // scriptpath
                if ($extension.scriptPath) {
                    workerSetting.scriptPath = $extension.scriptPath;
                } else if (workerSetting.scriptPath) {
                    $extension.scriptPath = workerSetting.scriptPath;
                }
                this.scriptPath = workerSetting.scriptPath;

                // extensionPath
                if ($extension.extensionPath) {
                    workerSetting.extensionPath = $extension.extensionPath;
                } else if (workerSetting.extensionPath) {
                    $extension.extensionPath = workerSetting.extensionPath;
                }
                this.extensionPath = workerSetting.extensionPath;

                // worker.path
                if (workerSetting.workerPath) {
                    this.workerPath = workerSetting.workerPath;
                }

                // 最多 worker 的數量
                if (typeof (workerSetting.max_workers) == 'number') {
                    this.workerCount = workerSetting.max_workers;
                }

                this.idleTime = workerSetting.idleTime;
                //-----------------------
                if (!this.scriptPath) {
                    throw new Error('no set scriptPath');
                }

                if (!this.extensionPath) {
                    throw new Error('no set extensionPath');
                }

                if (!this.workerPath) {
                    // throw new Error('no set workerPath');
                }

                if (typeof (this.workerCount) != 'number' || this.workerCount < 1) {
                    throw new Error("workerCount set error");
                }

                if (typeof (this.idleTime) != 'number' || this.idleTime < 0) {
                    throw new Error("idleTime set error");
                }
            };
            //------------------------------------------------------------------
            // 返回 promise
            this.addJob = function (args) {
                // debugger;
                console.log('--------------');
                console.log('WorkerCEO> 加入工作');

                let job = new Job(this, args);

                // 把任務加入
                this.jobList.unshift(job);
                //----------------------------
                // 檢查是否有 idle worker
                let w = this._checkIdleWorker();

                if (w) {
                    w.getJob();
                }
                console.log('--------------');
                return job.promise();
            };

            //------------------------------------------------------------------
            // 新增 worker
            this.addWorker = function (workerProxy) {
                this.workers.add(workerProxy);
            };
            //------------------------------------------------------------------
            // 移除指定的 worker
            this.removeWorker = function (workerProxy) {
                this.workers.delete(workerProxy);
            };
            //------------------------------------------------------------------
            // worker 想取得 job
            this._getJob = function () {
                let job = null;
                let $this = this;

                if (this.jobList.length > 0) {
                    job = this.jobList.pop();
                }

                if (this.jobList.length > 1) {
                    // 若還有很多工作未被接


                    setTimeout(function () {
                        let w = $this._checkIdleWorker();
                        if (w) {
                            w.getJob();
                        }
                    }, 0);

                }

                return job;
            };
            //------------------------------------------------------------------
            // 檢查是否有空閒的 worker
            this._checkIdleWorker = function () {
                let idleWork = null;
                // 找尋空嫌中的 worker
                let idleWorks = this._findIdleWorkers();

                if (idleWorks.length > 0) {
                    idleWork = idleWorks[0];
                }
                //----------------------------
                if (idleWork == null) {
                    // 沒有空閒中的 worker
                    if (this.workers.size < this.workerCount) {
                        // 沒有閒置的 worker
                        // 但已有的 worker 數量尚未達上限
                        console.log("no idle worker, create new worker.........");
                        idleWork = new WorkerProxy(this);
                    } else {
                        console.log('no idle worker and reachmax workers........');
                    }
                }

                return idleWork;
            };
            //------------------------------------------------------------------
            // 找出閒置中的 worker
            this._findIdleWorkers = function () {

                let workers = Array.from(this.workers);

                workers = workers.slice();

                workers = workers.filter(function (w) {
                    if (!w.busy && w.inited) {
                        return true;
                    }
                });
                console.dir(workers);
                return workers;
            };
        }).call(WorkerCEO.prototype);
        ////////////////////////////////////////////////////////////////////////
        // 主要重點之一
        // 包覆一個 worker
        // 能有更多資訊
        function WorkerProxy(ceo) {
            this.fn = WorkerProxy;
            this.id;
            this.ceo;
            this.job;
            this.worker;
            this.busy = false;
            this.timeHandle;
            this.e_end;
            this.e_error;
            this.inited = false;
            //-----------------------
            this._constructor(ceo);
        }
        WorkerProxy.uid = 1;
        //----------------------------------------------------------------------
        (function () {
            this._constructor = function (ceo) {
                this.ceo = ceo;
                this.id = this.fn.uid++;
                //------------------

                let workerContent = WorkerCEO.getWorkerContent();

                this.worker = new Worker(workerContent);

                this.worker.addEventListener('error', this._getErrorEvent());
                this.worker.addEventListener('message', this._getEndEvent());
                //------------------
                this.ceo.addWorker(this);

                // 初始化 worker
                // 叫 worker import _

                this.busy = true;

                console.log('worker(%s) init', this.id);
                // 請 worker 初始化
                this.worker.postMessage({
                    id: (this.id),
                    scriptPath: (this.ceo.scriptPath),
                    extensionPath: (this.ceo.extensionPath),
                    scriptList: (JSON.stringify(workerSetting.scriptList))
                });
            };
            //------------------------------------------------------------------
            // CEO 請他接下一個任務
            this.getJob = function () {
                this._check();
            };

            //------------------------------------------------------------------
            this._check = function () {
                console.log('worker(%s)(%s)進入檢查', this.id, this.busy);

                if (!this.inited) {
                    // 尚未初始化完成
                    // 初始化完成會自行接任務
                    return;
                }

                // 檢查是否有任務
                let job = this.ceo._getJob();

                if (job == null) {
                    if (this.ceo.workers.size == 1) {
                        // 只留下1個 worker時
                        // 就不讓他等死

                        console.log('worker(%s)沒工作，但只剩我一人，等接工作', this.id);
                        return;
                    } else {
                        console.log('worker(%s)沒工作，進入 idle', this.id)
                        // 等死吧
                        this._idle();
                    }
                } else {
                    console.log('worker(%s)接工作', this.id);
                    this._doJob(job);
                }
            };
            //------------------------------------------------------------------
            this._doJob = function (job) {

                if (this.timeHandle) {
                    console.log('worker(%s)俺正在 idle，被叫起來接工作', this.id);
                    // 若正在閒置中
                    clearTimeout(this.timeHandle);
                    this.timeHandle = undefined;
                }

                this.job = job;
                // debugger;

                let command = this.job.getCommand();
                command.id = this.id;
                console.log("id(%s)", command.id);
                console.log('worker(%s)(%s)(%s) 我發出任務 job(%s)', this.id, this.inited, this.busy, this.job.id);
                this.busy = true;

                // 請 worker 工作
                this.worker.postMessage(command);
            };
            //------------------------------------------------------------------
            // 進入 idle 狀態
            // 若已在 idle 狀態中，就不動作
            this._idle = function () {
                console.log('worker(%s)進入 idle', this.id);
                if (this.timeHandle) {
                    clearTimeout(this.timeHandle);
                    this.timeHandle = undefined;
                    console.log('worker(%s)問題點', this.id);

                }
                let self = this;

                this.timeHandle = setTimeout(function () {
                    self.timeHandle = undefined;
                    self._terminate();
                }, this.ceo.idleTime);
            };
            //------------------------------------------------------------------
            this._terminate = function () {

                console.log('worker(%s) in terminate', this.id);

                if (this.ceo.workers.size == 1) {
                    console.log('worker(%s) 只剩俺一個人，等事做', this.id);
                    // 只留下1個 worker時
                    // 就不刪除
                    return;
                }
                //-----------------------
                let idleWorks = this.ceo._findIdleWorkers();

                idleWorks = new Set(idleWorks);

                console.log('worker(%s)  idles(%s) hasme(%s)', this.id, idleWorks.size, idleWorks.has(this));

                if (idleWorks.size <= 1 && idleWorks.has(this)) {
                    // 大家都在忙，只剩我一個人有空
                    // 不要終結自己，等待工作
                    console.log('worker(%s) 大家都在忙，有空的只剩我一個人，再進入 idle', this.id);
                    this._idle();
                    return;
                }
                //-----------------------
                console.log("worker(%s) terminate", this.id);
                this.worker.removeEventListener('message', this._getEndEvent());
                this.worker.removeEventListener('error', this._getErrorEvent());

                this.ceo.removeWorker(this);
                this.worker.terminate();
                this.worker = undefined;
                this.id = undefined;
                this.fn = undefined;
                this.job = undefined;
                this.ceo = undefined;
            };
            //------------------------------------------------------------------
            this._getEndEvent = function () {
                if (this.e_end == null) {
                    // worker 工作完會呼叫此
                    this.e_end = (function (e) {

                        let job = this.job;
                        this.job = undefined;
                        this.busy = false;
                        //----------------------------
                        let data = e.data || {};
                        let res;

                        if (job) {
                            // 等待 worker 的工作完成
                            console.log('worker(%s) job finished', this.id);
                            if (typeof (data.res) != 'undefined') {
                                res = data.res;
                            }
                            job.resolve(res);
                        } else {
                            console.dir(job);
                            if (this.inited) {
                                throw new Error('worker(' + this.id + ') has initialized');
                            } else {
                                this.inited = true;
                            }
                            // 等待 worker 初始化完成
                            console.log('worker(%s) inited', this.id)
                        }

                        this._check();
                    }).bind(this);
                }

                return this.e_end;
            };
            //------------------------------------------------------------------
            this._getErrorEvent = function () {

                if (this.e_error == null) {
                    // worker error 完會呼叫此
                    this.e_error = (function (e) {
                        let job = this.job;
                        this.job = undefined;
                        this.busy = false;

                        if (job) {
                            console.log('worker(%s) job error', this.id);
                            // 等待 worker 的工作錯誤
                            job.reject(e);
                        } else {
                            // 等待 worker 初始化錯誤
                            console.log('worker(%s) inited error', this.id);
                        }

                        this._check();
                    }).bind(this);
                }
                return this.e_error;
            };
        }).call(WorkerProxy.prototype);
        ////////////////////////////////////////////////////////////////////////
        let jobUID = 0;

        function Job(ceo, args) {
            this.id = jobUID++;
            this.ceo = ceo;
            this.command;
            this.args;
            this.def;
            this.promise;
            this._resovle;
            this._reject;
            //----------------------------
            this._constructor(args);
        }
        //----------------------------------------------------------------------
        (function () {
            this._constructor = function (args) {

                this.command = args.shift();

                // console.log(typeof (_[this.command]));

                if (typeof (_[this.command]) !== "function") {
                    throw new TypeError("no this function(" + this.command + ")");
                }

                this.args = args;
                this.def = _.deferred();
            };
            //------------------------------------------------------------------
            // 對 worker 發出命令
            this.getCommand = function () {
                let command = {
                    command: (this.command),
                    args: (this.args),
                    jobID: (this.id)
                };
                return command;
            };
            //------------------------------------------------------------------
            this.resolve = function (data) {
                this.def.resolve(data);
            };
            //------------------------------------------------------------------
            this.reject = function (e) {
                this.def.reject(e);
            };
            //------------------------------------------------------------------
            this.promise = function () {
                return this.def.promise();
            };
        }).call(Job.prototype);

    }

})(this || {});