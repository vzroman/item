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

import {types} from "../types/index.js";
import {deepCopy} from "../utilities/data.js";

export class Attribute extends types.complex.Item{

    static options = {
        type:{type:types.Type, required:true, default: types.primitives.Any},
        required:{type:types.primitives.Any},
        default:{type:types.primitives.Any},
        virtual:{type:types.primitives.Bool, default:false }
    };

    constructor( options ){
        // We extracted our own options
        super( options );

        this._initType();

        this.bind("commit",changes=>{
            if (changes.type){
                this._initType();
            }else if(changes.hasOwnProperty("default")){
                this.set({default: this._type.coerce(this._options.default)})
            }
        });
    }

    _initType(){
        if (this._type){
            this._type.destroy();
        }
        this._type = new this._options.type( this._options.options );

        this.set({default: this._type.coerce( this._options.default )});
    }

    coerce( value ){
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

    destroy(){
        this._type.destroy();
        this._type = undefined;
        super.destroy();
    }
}
Attribute.extend();

export class Schema extends types.complex.Item{

    static options = {
        attributes:{ type:types.complex.Set, options:{schema:Attribute.options} }
    };

    constructor( Attributes ){
        super({attributes:Attributes});

        this._attributes = Object.entries( this._options.attributes ).reduce((acc,[a, options])=>{
            acc[a] = new Attribute( options );
            return acc;
        },{});

    }

    coerce( properties ){
        return this.get( this.set( properties ) );
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

            // TODO. Virtual fields are not returned, because they cannot be committed and saved?
            if (this._attributes[p].get("virtual") ){ continue }

            result[ p ] = this._attributes[ p ].coerce( properties[p] );

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

        for (const p in properties){

            // Remove the property if it is not in the schema
            if (!this._attributes.hasOwnProperty( p )){
                delete properties[ p ];
                continue;
            }

            properties[p] = this._attributes[p].coerce( properties[p] );
        }

        return properties;
    }

    destroy(){
        Object.values( this._attributes ).forEach( a=> a.destroy() );
        this._attributes = undefined;
        super.destroy();
    }
}
Schema.extend();

