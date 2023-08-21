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

import {Control} from "./control";
import {types} from "../../types";
import mainCss from "../../css/main.css";

export class Toggle extends Control{

    static options = {
        value:{type: types.primitives.Bool},
        text: {type: types.primitives.Set}
    };

    static markup = `<label class="${ mainCss.switch }">
        <input name="switch-input" class="${ mainCss.toggle_input }" type="checkbox">
        <span class="${ mainCss.slider } ${ mainCss.round }"></span>
        <span name="switch-on" class="${mainCss["switch_text-on"]}"></span>
        <span name="switch-off" class="${mainCss["switch_text-off"]}"></span>
    </label>`;

    constructor( options ){
        super( options );

        this.switch = this.$markup.find('[name="switch-input"]');

        ["mousedown","mouseup","click"].forEach(event => this.switch.on(event, e=>{
            if (this._options.disabled) return;
            e.stopPropagation();
        }));

        let on, off;

        if (this._options.text) {
            on = this.$markup.find('[name="switch-on"]').text(this._options.text.on);
            on.text(this._options.text.on);
            off = this.$markup.find('[name="switch-off"]');
            off.text(this._options.text.off);
        }

        this.switch.on("change", e=>{
            if (this._options.disabled) return;
            e.preventDefault();
            e.stopPropagation();

            this.set({ value: this.switch.prop('checked')});
        });

        this.bind("value", v => {
            if (!v) {
                on && on.css({color: "transparent"});
                off && off.css({color: "inherit"});
            } else {
                off && off.css({color: "transparent"});
                on && on.css({color: "white"});
            }
        })
    }

    updateValue( value=false, prev ){
        this.switch.prop('checked', value);
    }

    enable( value ){
        this.switch.prop('disabled', !value);
    }

    focus(){
        this.switch.focus();
    }
}
Toggle.extend();
