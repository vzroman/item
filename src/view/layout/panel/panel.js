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

import {View as Item} from "../../item.js";
import {types} from "../../../types/index.js"
import styles from "./panel.css";
import { primitives } from "../../primitives/index.js";

// The control is the point where external widgets to be attached
export class Panel extends Item{

    static options = {
        title: {type: types.primitives.String, default: ""}
    };
    
    markup(){
        const $markup = $(`<div class="${ styles.panel }">
            <div class="${ styles.header }">
                <div name="panel_title"></div>
                <div class="${ styles.button }"></div>
            </div>
            <div class="${ styles.content }"></div>
        </div>`);

        const $content = $markup.find(`.${ styles.content }`);
        this._options.$container.children().each(function() {
            $(this).appendTo($content);
        });

        return $markup;
    }

    
    widgets(){
        const $content = this.$markup.find(`.${ styles.content }`);

        let isOpen = false;
        return {
            panel_title: {
                view: primitives.Label,
                options: {
                    links: { text: "parent@title" },
                    events: { click: () => this.expandPanel(isOpen =! isOpen, $content) }
                }
            }
        }
    }

    expandPanel(isOpen, $content){
        if(isOpen){
            $content.slideDown();
            this.$markup.addClass( styles.open );
        }else{
            $content.slideUp();
            this.$markup.removeClass( styles.open );
        }
    }
}
Panel.extend();
