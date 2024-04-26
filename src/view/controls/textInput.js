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
import { Label } from "../primitives/label.js";

// The control is the point where external widgets to be attached
export class Control extends Parent{

    static options = {
        value:{type: types.primitives.String},
        length:{type: types.primitives.Integer},
        placeholder:{type: types.primitives.String},
        clearable:{type: types.primitives.Bool}
    };

    static events = {
        onInvalidInput:true
    };

    markup(){
        const $markup = $(`<div class="${ styles.input_container }">
            <input class="item_text_input ${ styles.input }" name="input" type="text"/>
            <div class="${styles.clear}" style="display: ${this._options.clearable ? 'flex' : 'none'}" name="clear"></div>
        </div>`);

        this.$input = $markup.find('[name="input"]');
        return $markup;
    }

    constructor( options ){
        super( options );

        this.$input = this.$markup.find('[name="input"]');
        this.$clear = this.$markup.find('[name="clear"]');

        this.bind("value", value => {
            this.$clear.toggleClass(styles.hidden_clear, !!!value);
        })

        const onChange = ()=> {
            const value = this.$input.val();
            this.$input.val( this.value() );
            this.set({value})
        };

        this.$input.on("change", onChange).on("keypress", event=>{
            if (event.which === 13){
                event.preventDefault();
                onChange();
            }
        });

        this.bind("placeholder",value => {
            if (value){
                this.$input.prop("placeholder", value);
            }else{
                this.$input.removeAttr("placeholder");
            }
        });
    }

    widgets(){
        return {
            clear: {
                view: Label,
                options: {
                    text: "x",
                    events: { click: () =>{
                        this.$input.val("");
                        this.set({value: ""});
                    }}
                }
            }
        }
    }

    updateValue( value, prev ){
        this.$input.val( value )
    }

    enable( value ){
        this.$input.prop('disabled', !value);

        if (value){
            this.$input.removeClass(styles.disabled);
        }else{
            this.$input.addClass(styles.disabled);
        }
    }

    focus(){
        this.$input.focus();
    }

    setValid(isValid, value){
        if(isValid){
            this.$markup.removeClass(styles.invalid);
            this.$markup.removeClass("invalid");
        }else{
            this.$markup.addClass(styles.invalid);
            this.$markup.addClass("invalid");
            this.$input.val(value);
        }
    }
}
Control.extend();
