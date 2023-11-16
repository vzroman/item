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

import {Control as Parent} from "../control.js";
import {types} from "../../../types/index.js"
import styles from "./panel.css";
import { primitives } from "../../primitives/index.js";

// The control is the point where external widgets to be attached
export class Control extends Parent{

    static options = {
        title: {type: types.primitives.String, default: ""}
    };

    #isOpen = false;
    
    markup(){
        const $markup = $(`<div>
        <div class="${styles.panel_wrapper}" style="position:relative">
            <div name="panel_title"></div>
            <div name="panel_button"></div>
        </div>
        <div name="panel_content" style="display:none"></div>
    </div>`);

    const $content = $markup.find('[name="panel_content"]');
    this._options.$container.children().each(function() {
        $(this).appendTo($content);
    });

    return $markup;
    }

    
    widgets(){
        const content = this.$markup.find('[name="panel_content"]')
        const button = this.$markup.find('[name="panel_button"]')
        const wrapper = this.$markup.find(`[class="${styles.panel_wrapper}"]`)

        return {
            panel_title: {
                view: primitives.Label,
                options: {
                    links: { text: "parent@title" },
                    events: { click: () => {
                        const isOpen = !this.#isOpen;
                        this.expandPanel(isOpen,content, button, wrapper)
                        this.#isOpen = isOpen
                    } }
                }
            }
        }
    }

    expandPanel(isOpen, content, button, wrapper){
        if(isOpen){
            content.slideDown().css({padding:"0.5em"});
            button.addClass(`${styles.rotated}`)
            wrapper.css({color:"#0c63e4", background:"#e7f1ff"})
        }else{
            content.slideUp().css({padding: "0"})
            button.removeClass(`${styles.rotated}`)
            wrapper.css({color:"#696969", background:"#f5f6f7", border:""})
        }
    }
}
Control.extend();
