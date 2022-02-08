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

import {Linkable} from "./linkable.js";
import {types as primitives} from "../types/primitives/index.js";
import {deepCopy} from "../utilities/data.js";

export class Attribute extends Linkable{

    static options = {
        type:primitives.Class,
        options:{class:primitives.Any},
        required:false,
        default:undefined,
        virtual:false
    };

    constructor( options ){
        // We extracted our own options
        super( options );

        this._initType();

        this.bind("change",changes=>{
            if (changes.type || changes.options){
                this._initType();
            }else if(changes.hasOwnProperty("default")){
                this.set({default: this._type.coerce(this._options.default)})
            }
        });
    }

    _initType(){

        if ( primitives.Any !== this._options.type && !primitives.Any.isPrototypeOf(this._options.type) )
            throw new Error("invalid type: " + this._options.type);

        if (this._type){
            this._type.destroy();
        }
        this._type = new this._options.type( this._options.options );

        this.set({default: this._type.coerce( this._options.default )});
    }

    validate( value ){
        // Type validation
        value  = this._type.coerce( value );

        if (
            (value === null || value === undefined)
            && this._options.default !== null
            && this._options.default !== undefined
        ){
            return deepCopy( this._options.default )
        } else {
            return value;
        }
    }

    filter( filter ){
        let result = true;
        for (const p in filter){
            if (this._options[p] !== filter[p]){
                result = false;
                break;
            }
        }
        return result;
    }

    destroy(){
        this._type.destroy();
        this._type = undefined;
        super.destroy();
    }
}
Attribute.extend();

export class Schema extends Linkable{

    static options = {
        attributes:undefined
    };

    constructor( Attributes ){
        super({attributes:Attributes});

        if (typeof this._options.attributes !== "object")
            throw new Error("invalid schema attributes: " + this._options.attributes);

        this._attributes = Object.entries( this._options.attributes ).reduce((acc,[a, options])=>{
            acc[a] = new Attribute( options );
            return acc;
        },{});

    }

    validate( properties ){
        return this.get( this.set( properties ) );
    }

    coerce( properties ){

        // Return only properties that are defined in the schema
        let result = {};
        for (let p in this._attributes){
            result[ p ] = this._attributes[ p ].validate( properties[p] );
        }

        return result;
    }

    link( sources ){
        sources = super.link( sources );
        const attrSources = {...sources,parent:this};
        Object.values( this._attributes ).forEach( a => a.link(attrSources) );
        return sources;
    }

    get( properties ){

        // Return only properties that are defined in the schema
        let result = {};
        for (let p in this._attributes){

            result[ p ] = this._attributes[ p ].validate( properties[p] );

            // If one of the required properties is not defined then the whole result
            // is undefined
            if ( result[ p ] === undefined && this._attributes[ p ].get("required") ){
                result = undefined;
                break;
            }
        }

        return result;
    }

    set( properties ){
        const result = {};
        for (const p in properties){

            // Remove the property if it is not in the schema
            if (!this._attributes.hasOwnProperty( p )){
                continue;
            }

            result[p] = this._attributes[p].validate( properties[p] );
        }

        return result;
    }

    filter( filter, properties ){

        let attributes = properties;
        if (!attributes){
            attributes = {};
            for (const a in this._attributes){
                attributes[ a ] = true;
            }
        }

        let result = {};
        for (const a in attributes){
            if ( this._attributes[a] && this._attributes[a].filter(filter) ) {
                result[ a ] = attributes[ a ];
            }
        }

        if (!properties){
            result = Object.keys( result );
        }

        return result;
    }

    destroy(){
        Object.values( this._attributes ).forEach( a=> a.destroy() );
        this._attributes = undefined;
        super.destroy();
    }
}
Schema.extend();

