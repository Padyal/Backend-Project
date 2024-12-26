 class ApiError extends Error{
    constructor(
        statusCod,
        message='Something went wrong',
        errors=[],
        statck=""
    ){
        super(message)
        this.statusCod = statusCod
        this.data = null
        this.message=message
        this.success=false
        this.errors=errors

        if(statck){
            this.stack = statck
        }else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
 }

export {ApiError}
