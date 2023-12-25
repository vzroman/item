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

import {View} from "../item.js";
import {types} from "../../types/index.js";
import {deepEqual} from "../../utilities/data.js";


// The control is the point where external widgets to be attached
export class Control extends View{

    static options = {
        value:{type:types.primitives.Any},
        validate:{type: types.primitives.Set }
    };

    constructor( options ){
        super( options );

        this._widget = undefined;

        this._validator = this._options.validate
            ? new this.constructor.options.value.type( this._options.validate )
            : undefined; 

        // We do it asynchronously because descendants should be
        // able to init their widget
        setTimeout(()=>{
            if (!this._controller) return;
            this.bind("value",(value, prev) => {
                let isValid; 

                if ( this._validator ){
                    const _value = this._validator.coerce( value );
                    isValid =  
                        (_value !== undefined)
                        // control initialization
                        || (value === undefined && prev===undefined) ;
                    if (deepEqual(value, _value)){
                        this.updateValue( value, prev );
                    }else{
                        this.setValue( _value !== undefined ? _value : null );
                    }
                }else{
                    isValid = true;
                    this.updateValue( value, prev );
                }

                this.setValid(isValid, value);
            });
        }); 
    }

    // The same method for getting or setting value.
    // If argument is undefined the method return value
    // else - sets value
    value( value ){
        if (value===undefined){
            return this.getValue();
        }else{
            this.setValue(value);
        }
    }

    getValue(){
        return this.get("value");
    }

    setValue(value){
        this.set({value});
    }

    updateValue( value, prev ){
        // Override it to update the value of the external widget
    }

    setValid(isValid){
        // Override it to update the value of the external widget
    }

    enable( value ){
        if (this._widget && typeof this._widget.enable === "function"){
            this._widget.enable( value );
        }
    }

    focus(){
        if (this._widget && typeof this._widget.focus === "function"){
            this._widget.focus();
        }
    }

    destroy(){
        if (this._widget && typeof this._widget.destroy === "function"){
            this._widget.destroy();
            this._widget = undefined;
        }
        super.destroy();
    }
}
Control.extend();
