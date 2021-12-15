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

import {Controller as Item} from "../item.js";

export class Controller extends Item{
    constructor( options ){

        options = {...{
                connection: undefined,   // required!
                timeout: 60000,
                subscribe: false         // TODO. the data is synchronized with database
            }, ...options };

        if ( !options.connection ){ throw "connection is required"}

        super( options );

        this._data = undefined;
        this._changes = undefined;
    }

    //-------------------------------------------------------------------
    // Data access API
    //-------------------------------------------------------------------
    init( ID ){
        return new Promise((resolve, reject)=>{

            // New object
            if (!ID){ return resolve( undefined ) }

            this._ID = ID;
            const fields = this._requestFields();

            this._options.connection().query(`get ${ fields } from * where .oid = $oid('${ ID }') format $to_json`,([H,...Items])=>{
                if (Items.length === 0){
                    // The object doesn't exist yet
                    resolve( undefined );
                }else{
                    let data = Items[0];
                    data = H.reduce((acc,n,i) => {
                        acc[n] = data[i];
                        return acc;
                    },{});

                    super.init( data );
                    resolve( data );
                }
            }, reject, this._options.timeout );
        });
    }

    setSubscribe( value ){
        // TODO
    }

    _commit(){
        return new Promise((resolve, reject)=>{
            if (this._data){
                // the object already exits
                this._options.connection().edit_object(this._ID, this._changes, resolve, reject, 60000);
            }else{
                // new object
                this._options.connection().create_object(this.get(), ID=>{
                    this._ID = ID;
                    resolve( ID );
                },reject, this._options.timeout);
            }
        });
    }

    _requestFields(){
        const schema = this._options.schema || {};
        return Object.keys({

            // All fields in the schema for which default values are defined
            ...Object.entries(schema).reduce((acc,[f,settings])=>{
                if (settings.hasOwnProperty("default")){
                    acc[f] = true;
                }
                return acc;
            },{}),

            // All key in schema which are bound
            ...Object.keys(schema).reduce((acc,f)=>{
                if (this.__events.callbacks[f]){
                    acc[f] = true;
                }
                return acc;
            },{}),
        });
    }
}
