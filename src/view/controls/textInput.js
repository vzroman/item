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

// The control is the point where external widgets to be attached
export class Control extends Parent{

    static options = {
        length:{type: types.primitives.Integer}
    };

    static markup = `<input type="text"/>`;

    constructor( options ){
        super( options );

        this.bind("value", value => this.$markup.val( value ));

        const onChange = ()=> this.set({ value:this.$markup.val() });
        this.$markup.on("change", onChange).on("keypress", event=>{
            if (event.which === 13){
                event.preventDefault();
                onChange();
            }
        });

        this.bind("length",length => {
            if (length){
                console.log("set length", length);
                this.$markup.prop("maxlength",length);
            }else{
                this.$markup.removeAttr("maxlength");
            }
        });
    }

    enable( value ){
        this.$markup.prop('disabled', !value);
    }

    focus(){
        this.$markup.focus();
    }
}
Control.extend();
