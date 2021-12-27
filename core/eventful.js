//------------------------------------------------------------------------------------
// MIT License
//
// Copyright (c) 2021 vzroman
// Author: Vozzhenikov Roman, vzroman@gmail.com
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
//     The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
//     THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//     FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//     OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
//------------------------------------------------------------------------------------
export class Eventful{

    bind(event, callback){
        if (typeof callback!=="function") { throw new Error("invalid callback") }

        this.__events=this.__events||{
            id:0,
            callbacks:{},
            index:{}
        };

        // Unique id for the handler. The is an increment
        // it makes possible to run callbacks in the same order
        // they subscribed
        const id=this.__events.id++;

        this.__events.index[id]=event;
        this.__events.callbacks[event]={...this.__events.callbacks[event],...{[id]:callback}};

        return id;
    }

    unbind(id){
        const type=this.__events?this.__events.index[id]:undefined;
        if (type){
            delete this.__events.index[id];
            delete this.__events.callbacks[type][id];
        }
    }

    _trigger(type, params) {
        const callbacks=this.__events?this.__events.callbacks[type]:undefined;

        if (callbacks){
            if (!Array.isArray(params)){
                params = [params];
            }

            // IMPORTANT! Trigger works asynchronously
            setTimeout(()=>{
                Object.keys(callbacks).map(k=> +k).sort().forEach(id=>{
                    try{
                        callbacks[id].apply(this, [...params,this]);
                    }catch(e){
                        console.error("invalid event callback",e);
                    }
                })
            });
        }
    }

    destroy(){
        this.__events = undefined;
    }
}
