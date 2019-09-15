///////////////////////////////////////////////////////////////////////////////
//
// 便於使用者操作
//
//
///////////////////////////////////////////////////////////////////////////////
class JobForUser {

    constructor(manager, args) {
        this.manager = manager;
        this.jobArgs = args;
        this.jobOptions = {
            timeout: null
        };
    }
    //---------------------------------
    // 對單一任務設置選項
    setOptions(k, v) {
        let options = {};
        if(typeof k == "object" && v == null){
            options = k;
        }else{
            options[k] = v;
        }

        for (let k in options) {
            if(k in this.jobOptions){
                this.jobOptions[k] = options[k];
            }
        }

        return this;
    }
    //---------------------------------
    // 設置單一任務過期時間
    setTimeout(time) {
        this.jobOptions["timeout"] = time;
        return this;
    }
    //---------------------------------
    // 開始任務
    start() {
        let p = this.manager.addJob(this.jobArgs, this.jobOptions);
        return p;
    }
}

export { JobForUser };