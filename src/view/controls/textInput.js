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

import {Control as Parent} from "./control.js";
import {types} from "../../types/index.js";
import styles from "./textInput.css"

// The control is the point where external widgets to be attached
export class Control extends Parent{

    static options = {
        value:{type: types.primitives.String},
        length:{type: types.primitives.Integer},
    };

    static events = {
        onInvalidInput:true
    };

    static markup = `<input type="text" class="item_text_input ${ styles.input }"/>`;

    constructor( options ){
        super( options );

        const onChange = ()=> {
            const val = this.$markup.val()
            const _value = this.validateValue(val)
            if(_value){
                this.$markup.removeClass(styles.invalid);
                this.$markup.removeClass("invalid");
                this.set({ value:_value});
                this.$markup.val(_value)
            }else{
                this.$markup.addClass(styles.invalid);
                this.$markup.addClass("invalid");
                this._trigger("onInvalidInput", val);
            } 
        };

        this.$markup.on("change", onChange).on("keypress", event=>{
            if (event.which === 13){
                event.preventDefault();
                onChange();
            }
        });
    }

    updateValue( value, prev ){
        this.$markup.val( value )
    }

    enable( value ){
        this.$markup.prop('disabled', !value);
    }

    focus(){
        this.$markup.focus();
    }

    validateValue(value){
        if(!this._options.validate) return value
        if(new RegExp(this._options.validate.pattern).test(value)){
            return value
        }

        return undefined
    }
}
Control.extend();
