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
import styles from "./button.css";

// The control is the point where external widgets to be attached
export class Control extends Parent{

    static options = {
        text:{type:types.primitives.String},
        title:{type:types.primitives.String},
        icon:{type:types.primitives.String},
        white_space:{type:types.primitives.String, default:"nowrap"}
    };
    static markup = `<button class="${ styles.button } item_button">
        <div name="icon" class="${ styles.icon }"></div>
        <div name="text"></div>
    </button>`;

    constructor( options ){
        super( options );

        const $text = this.$markup.find('[name="text"]');
        const $icon = this.$markup.find('[name="icon"]');

        this.bind("text", value => {
            $text.text( value );
        });

        this.bind("icon", value => {
            let css = value
                ?{
                    "background-image":value,
                    "display":"block"
                }
                :{
                    "background-image":"",
                    "display":"none"
                };
            $icon.css( css );
        });

        this.bind("title", value => this.$markup.attr("title", value));
        this.bind("white_space", value => $text.css("white-space",value))
    }

    enable( value ){
        this.$markup.prop('disabled', !value);
    }

    focus(){
        this.$markup.focus();
    }
}
Control.extend();
