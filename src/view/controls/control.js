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
import {deepCopy} from "../../utilities/data.js";
import {waiting} from "../../utilities/waiting.js";
import styles from "./control.css";


// The control is the point where external widgets to be attached
export class Control extends View{

    static options = {
        value:{type:types.primitives.Any},
        validate:{type: types.primitives.Set }
    };

    constructor( options ){

        if (!options.waiting) {
            options.waiting = ()=>this.waiting();
        }

        super( options );

        this._widget = undefined;

        this._validator = this._options.validate
            ? new this.constructor.options.value.type( this._options.validate )
            : undefined;

        // Validate the value
        if ( this._validator ){
            this._controller.bind("beforeChange",(changes) => {
                if (!changes?.hasOwnProperty("value")) return;

                // No validation if it's a value reset
                if (changes.value === null) return;

                const value = deepCopy(changes.value);

                changes.value = this._validator.coerce( changes.value );
                this.setValid(changes.value!==undefined, value);
                if (changes.value===undefined) delete changes.value;
            });
        }
        // We do it asynchronously because descendants should be
        // able to init their widget
        setTimeout(()=>{
            if (!this._controller) return;

            this.updateValue( this.value(), undefined );
            this.bind("beforeChange",(changes) => {
                if (changes.hasOwnProperty("value")){
                    const prev = this.value();
                    setTimeout(()=> {
                        if (this._controller) this.updateValue( this.value(), prev )
                    });
                }
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

        if (value){
            this.$markup.removeClass(styles.disabled);
        }else{
            this.$markup.addClass(styles.disabled);
        }
    }

    focus(){
        if (this._widget && typeof this._widget.focus === "function"){
            this._widget.focus();
        }
    }

    waiting( request ){
        const unlock = waiting( this.$markup );
        request.finally(unlock);
    }

    _destroy(){
        if (this._widget && typeof this._widget.destroy === "function"){
            this._widget.destroy();
            this._widget = undefined;
        }
        super._destroy();
    }
}
Control.extend();