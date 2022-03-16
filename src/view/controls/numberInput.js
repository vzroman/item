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

import {Control as Parent} from "./textInput.js";
import {types} from "../../types/index.js";

// The control is the point where external widgets to be attached
export class Control extends Parent{

    static options = {
        value:{type: types.primitives.Float},
        step:{type: types.primitives.Float},
    };

    markup(){
        let isInteger = false;
        if (typeof this._options.step === "number" && Math.round(this._options.step) === this._options.step){
            const value = typeof this._options.value === "number"
                ? this._options.value
                : this._options.validate?.min;
            if (typeof value ==="number" && Math.round(value) === value ) isInteger = true;
        }

        isInteger = isInteger
            ? ` oninput="this.value=this.value.replace(/[^0-9]/g,'');"`
            : ``;

        return `<input type="number" ${ isInteger } />`
    }

    constructor( options ){
        super( options );

        this.bind("step",value => {
            if (typeof value === "number"){
                this.$markup.prop("step", value);
            }else{
                this.$markup.removeAttr("step");
            }
        });

        this.bind("validate", value=>{
            value = value || {};

            ["max","min"].forEach( prop => {
                if (typeof value[prop] === "number"){
                    this.$markup.prop(prop, value[prop]);
                }else{
                    this.$markup.removeAttr(prop);
                }
            });
        });
    }
}
Control.extend();
