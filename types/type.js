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

import {types} from "./index.js";
import {deepMerge,deepCopy} from "../utilities/data.js";
import {Controller} from "../controllers/item.js";

export class Type {

    // The options are described as attributes
    static options = {
        links:{type:types.primitives.Set, virtual:true },
        events:{type:types.primitives.Set, virtual:true }
    };


    constructor( options ){

        // Options are linkable to data
        this._controller = new Controller({
            schema: this.constructor.override(),
            autoCommit:true,
        });

        this._controller.init( options );

        this._options = this._controller.get();

        this._controller.bind("commit", options =>{
            this._options = options;
        });

    }

    static override(){
        if (Type.isPrototypeOf( this ) ){
            // I'm a successor of Type.
            // !Attention the strict inheritance the successor can extend the predecessor's options
            // But not to override them
            return deepMerge( this.options, Object.getPrototypeOf(this).override() );
        }else{
            // I'm the Type
            return deepCopy( this.options );
        }
    }

    options( options ){
        if ( Array.isArray( options ) || options === undefined ){
            return this._controller.get( options );
        }else{
            return this._controller.set( options );
        }
    }

    coerce( value ){
        if (value instanceof this.constructor){
            return value;
        }else if(typeof value === "string"){

            // The value of the type can be defined as a string "types.primitives.Any"
            let index = types;
            for (const i of value.split(".")){
                if ( index[i] ){
                    index = index[i];
                }else{
                    console.warn("invalid type", value);
                    return undefined;
                }
            }

            return this.coerce( index );

        }else{
            return undefined;
        }
    }

    link( controller ){

        // Links
        const links = this._controller.get("links");
        if ( links ){
            Object.entries(links).forEach(([prop, params])=>{

                // Properties go from up to down
                link(controller, params , value =>{
                    this._controller.set({[prop]:value});
                });
            })
        }

        // Events
        const events = this._controller.get("events");
        if ( events ){

            Object.entries( events ).forEach(([event, params])=>{

                // Events go from down to up
                link(this._controller, params , value =>{
                    controller.set({[event]:value});
                })
            })
        }
    }

    destroy(){
        this._controller.destroy();
        this._controller = undefined;
        this._options = undefined;
    }
}

function link( controller, params, callback ) {
    if (typeof params === "string"){
        // simple direct link
        controller.bind( params, callback );

        // The first init
        return (async function () {
            const value = await controller.get( params );
            if (value !== undefined){
                callback( value )
            }
        })();
    }else{
        // Transformation
        let {vars, value} = params;

        if (typeof vars === "string"){
            vars = [vars];
        }

        vars.forEach(prop => controller.bind( prop, onChange ));

        async function onChange() {
            callback( value.apply(this, await controller.get(vars) ) );
        }

        // The first init
        return onChange();
    }
}