
export class Ecomet{
    constructor (){
        this._connection=undefined;
        this._actions={};
        this._actionId=0;
    }
    connect(IP,Port,Protocol,OnOk,OnError,OnClose){
        this.connectUrl(Protocol+"//"+IP+":"+Port+"/websocket",OnOk,OnError,OnClose);

    }

    connectUrl(URL,OnOk,OnError,OnClose){
        URL=URL.replace("https:","wss:");
        // If the original protocol is https (secure)
        // then here is nothing left to replace
        URL=URL.replace("http:","ws:");
        try {
            this._connection=new WebSocket(URL);
            this._connection.onopen=OnOk;
            this._connection.onmessage=event=>{ this._on_receive(event.data) };
            this._connection.onclose=()=>{
                this._connection=undefined;
                this._actions={};
                OnClose();
            };
        } catch(Error){ OnError(Error); }

    }

    close(){
        this._connection.onclose=undefined;
        this._connection.close();
        delete this._connection;
        this._actions={};
    }

    is_ok() {
        if (this._connection===undefined){ return false; }
        return (this._connection.readyState===1);
    }

    login(login,pass,OnOk,OnError,Timeout) {
        return this._action("login",{login,pass},OnOk,OnError,Timeout,-1);
    }

    create_object(fields,OnOk,OnError,Timeout) {
        return this._action("create",{fields},OnOk,OnError,Timeout,-1);
    }

    edit_or_create_object(fields,OnOk,OnError,Timeout) {
        return this._action("edit_or_create",{fields},OnOk,OnError,Timeout,-1);
    }

    edit_object(oid,fields,OnOk,OnError,Timeout) {
        return this._action("update",{oid,fields},OnOk,OnError,Timeout,-1);
    }

    delete_object(oid,OnOk,OnError,Timeout) {
        return this._action("delete",{oid},OnOk,OnError,Timeout,-1);
    }

    find(statement,OnOk,OnError,Timeout) {
        let all=true;
        if (!statement.startsWith("GET *")){
            all=false;
            statement = statement.replace("GET ","GET .oid,");
        }
        //const _t=+new Date();
        statement = statement+" format $to_json";
        return this._action("query",{statement},(Result)=>{
            //console.log("find",(+new Date()-_t),statement);
            if (Result.count!==undefined){
                Result = { total:Result.count, set:Ecomet.to_ecomet1(Result.result,all) };
            }else if(Array.isArray(Result)){
                Result={ total:Result.length-1, set: Ecomet.to_ecomet1(Result,all) };
            }
            OnOk(Result);
        },OnError,Timeout,-1);
    }
    static to_ecomet1([Header,...Rows],all){
        if (all){
            return Rows.map(Object=>{
                const oid = Object[0][".oid"];
                delete Object[0][".oid"];
                return {
                    oid:oid,fields:Object[0]}
            })
        }else{
            const oid=Header.indexOf(".oid");
            return Rows.map(Values=>{
                return { oid:Values[oid], fields:Values.reduce((acc,v,i)=>{
                    if (i !== oid) {
                        acc[Header[i]]=v;
                    }
                    return acc;
                },{})}
            });
        }
    }

    query(statement,OnOk,OnError,Timeout) {
        return this._action("query",{statement},OnOk,OnError,Timeout,-1);
    }

    get(statement,OnOk,OnError,Timeout){
        return this.query(statement,result => {
            if ( statement.match(/^get\s+\.oid\s+from/) ){
                let Items = result.map(oid => { return {".oid":oid} });
                OnOk( Items );
            }else{
                let [H,...Items] = result;
                Items = Items.map(item => H.reduce((acc, name, i)=>{
                    acc[name] = item[i];
                    return acc;
                },{}));

                OnOk( Items );
            }
        }, OnError, Timeout);
    }

    subscribe(statement,OnCreate,OnUpdate,OnDelete,OnError) {
        const id=this._actionId++;
        let map={
            "create":(typeof OnCreate==='function')?OnCreate:undefined,
            "update":(typeof OnUpdate==='function')?OnUpdate:undefined,
            "delete":(typeof OnDelete==='function')?OnDelete:undefined
        };
        statement="SUBSCRIBE '"+id+"' "+statement + " format $to_json";
        const OnOk=result=>{
            if (result==="ok"){
                // This is confirmation of the request
                return;
            }
            if (map[result.action]){ map[result.action](result); }
        };
        return this._action("query",{statement},OnOk,OnError,undefined,id);
    }

    unsubscribe(id,OnOk,OnError) {
    	if(this._actions[id] && !this._actions[id].singleResponse){
            return this._action("query",{statement:"unsubscribe '"+id+"'"},()=>{
                delete this._actions[id];
                    if (typeof OnOk==='function') { OnOk(); }
                },
                ErrorText=>{
                    delete this._actions[id];
                    if (typeof OnError==='function') { OnError(ErrorText); }
                },30000,id);
    	}else{
            if (typeof OnOk==='function') { OnOk(); }
        }

    }
    application(module,method,params,OnOk,OnError,Timeout) {
        const request={
            "module":module,
            "function":method,
            "function_params":params
        };
        return this._action("application",request,OnOk,OnError,Timeout,-1);
    }

    //=======================================================================
    //      Request to the server
    //=======================================================================
    _action(Type,Params,OnOk,OnError,Timeout,Id) {
        if (this._connection===undefined) { throw "No connection"; }
        // If the Id is not defined, generate it as a connection related increment
        // The increment is defined only for subscriptions
        let singleResponse=false;
        if (Id===-1){
            Id=this._actionId++;
            singleResponse=true;
        }

        // Put the request into the queue
        this._actions[Id]={
            "ok":OnOk,
            "error":OnError,
            "singleResponse":singleResponse
        };

        // Send the request to the server
        this._connection.send(JSON.stringify({id:Id,action:Type,params:Params}));

        // Watch the timeout if it is defined
        if ((Timeout!==undefined)&&(typeof OnError==='function')){
            setTimeout(()=>{
                if (this._actions[Id]!==undefined){
                    // The time is up, but the request is still waiting in the queue
                    OnError("timeout");
                    delete this._actions[Id];
                }
            },Timeout);
        }
        return Id;
    }

    //=======================================================================
    //      Response from the server
    //=======================================================================
    _on_receive(response){
        response=JSON.parse(response);
        // The action is already removed from the queue, probably by timeout
        if (this._actions[response.id]===undefined){
            console.warn("Response for undefined request is received",response);
            return;
        }
        // Call the user handler
        if (typeof this._actions[response.id][response.type]==='function'){
            this._actions[response.id][response.type](response.result);
        }
        // Clean the queue if it is the single response item
        if (this._actions[response.id]&&this._actions[response.id].singleResponse){
            delete this._actions[response.id];
        }
    }
}
