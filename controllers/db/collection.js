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
import {Controller as Collection} from "../collection.js";
import {patch2value} from "../../utilities/data";

export class Controller extends Collection{

    static options = {
        connection:undefined,
        timeout: 60000,
        subscribe:false
    };

    constructor( options ){
        // id is always oid
        super( {...options, id:".oid"} );

        if (typeof this._options.connection !== "function")
            throw new Error("invalid connection: " + this._options.connection);
    }

    //-------------------------------------------------------------------
    // Data access API
    //-------------------------------------------------------------------
    init( filter ){

        filter = this.constructor.filter2query( filter );

        return new Promise((resolve, reject)=>{

            const fields = [this._options.id,...this._schema.filter({virtual:false})].join(",");

            this._options.connection().get(`get ${ fields } from * where ${ filter } format $to_json`, data=>{

                resolve( super.init( data ) );

            }, reject, this._options.timeout );
        });
    }

    setSubscribe( value ){
        // TODO
    }

    commit(){
        return new Promise((resolve, reject)=>{

            if ( !this.isCommittable() ) return reject("not ready");

            if ( this._ID ){
                // the object already exits
                const changes = this._schema.filter( {virtual:false}, patch2value(this._changes, 0) );
                if ( !Object.keys(changes).length ){
                    // No changes in persistent fields
                    super.commit().then(resolve, reject);
                }else{
                    // Send a query to the database
                    this._options.connection().edit_object(this._ID, changes, ()=>{
                        super.commit().then(resolve, reject);
                    }, reject, this._options.timeout);
                }
            }else{
                // new object
                const fields = this._schema.filter( {virtual:false}, this.get() );
                this._options.connection().create_object(fields, ID=>{
                    this._ID = ID;
                    super.commit().then(resolve, reject);
                },reject, this._options.timeout);
            }
        });
    }

    static filter2query( filter ){
        if ( filter[0] === "and" || filter[0] === "or"){
            return `${ filter[0] }(${ filter[1].map( this.filter2query ).join(",") })`;
        }else if(filter[0] === "andnot"){
            return `andnot(${ this.filter2query(filter[1][0]) }, ${ this.filter2query(filter[1][1]) })`;
        }else{
            let [ field, operator, value ] = filter;

            if (operator === "[]"){
                let [from, to] = value;
                if (typeof from === "string"){ from = `'${ from }'`}
                if (typeof to === "string"){ to = `'${ to }'`}

                return field +" [" +from+":"+to+"]";
            }else{
                if (typeof value === "string"){
                    if ( value.startsWith("'") ){
                        value = value.substr(1);
                    }else if ( !value.startsWith("$") ){
                        value = `'${ value }'`;
                    }
                }

                return `${ field } ${ operator } ${ value }`;
            }
        }
    }
}
Controller.extend();
