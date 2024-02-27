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

import {View as ItemView} from "../item.js";
import {types} from "../../types";
import {controls} from "../controls";
import {deepMerge} from "../../utilities/data";
import style from "../widgets/pager.css";
import first from "./pager/first.svg"
import firstBlue from "./pager/first_blue.svg"
import previous from "./pager/previous.svg"
import previousBlue from "./pager/previous_blue.svg"
import {primitives} from "../primitives";
import {collections} from "../collections";
import {Controller as Collection} from "../../controllers/collection";


export class Pager extends ItemView{

    static options = {
        page:{type:types.primitives.Integer, default: 1},
        totalCount:{type:types.primitives.Integer},
        pageSize:{type:types.primitives.Integer},
        pageSizeValues:{type:types.primitives.Array, default: [30, 100, 10000]},
        maxVisible:{type:types.primitives.Integer, default: 10}
    };

    static markup = `
    <div class="${style.pager_wrapper}" style="display:flex">
        <div style="display:flex;flex-grow:1;gap:20px; align-items: stretch;">
            <div class="${ style.pagination }">
                <div name="first"></div>
                <div name="prev"></div>
                <div name="pages"></div>
                <div name="next"></div>
                <div name="last"></div>
            </div>
            <div name="pageSize"></div>
        </div> 
        <div name="total" class="${style.total}"></div>
    </div>`;
 
    constructor( options ) {
        options = deepMerge({
            links : {
                page:"data@$.page",
                totalCount: "data@$.totalCount",
                pageSize:"data@$.pageSize"
            },
            events : {
                page:"data@$.page",
                pageSize: "data@$.pageSize"
            }
        }, options );

        super( options );
    }

    widgets(){

        this._pages = new Collection({
            id:"page",
            schema:{ page:{type: types.primitives.Integer } },
            keyCompare:([a],[b])=>{
                a = +a;
                b = +b;
                if ( a > b ) return 1;
                if ( a < b ) return -1;
                return 0;
            },
            data:[{page:1}]
        });

        this.bind(["page","totalCount","pageSize","maxVisible"],({page,totalCount,pageSize,maxVisible})=>{
            const pages = this._pages.get();
            for (let p in pages){
                pages[p] = null;
            }

            if (typeof totalCount !== "number" || totalCount === 0){
                pages[1]={page:1};
            }else{
                pageSize = pageSize ?? totalCount;
                const totalPages = Math.ceil( totalCount / pageSize );
                const totalPacks = Math.ceil( totalPages / maxVisible );
                let pack = Math.floor( (page-1) / maxVisible );

                const first = pack * maxVisible + 1;
                const last = (pack +1) < totalPacks
                    ? first + maxVisible - 1
                    : totalPages ;


                for (let i = first; i <= last; i++){
                    pages[i]={page:i}
                }
            }
            this._pages.set( pages )
        });

        return {
            first: {
                view: controls.Button,
                options: {
                    title:"first",
                    links: {
                        enable:{source:"parent", event:"page", handler:p =>p > 1},
                        icon:{ source:"self", event:"enable", handler:val=>{
                            if (val){
                                return `url("${ firstBlue }")`;
                            }else{
                                return `url("${ first }")`;
                            }
                        }}
                    },
                    events:{
                        click:{target:"parent@page", handler:()=>1}
                    }
                }
            },
            prev: {
                view: controls.Button,
                options: {
                    title:"previous",
                    links: {
                        enable:{source:"parent", event:"page", handler:p => p > 1},
                        icon:{ source:"self", event:"enable", handler:val=>{
                            if (val){
                                return `url("${ previousBlue }")`;
                            }else{
                                return `url("${ previous }")`;
                            }
                        }}
                    },
                    events:{
                        click:{target:"parent@page", handler:()=> (this._options.page??0) - 1  }
                    }
                }
            },
            pages:{
                view: collections.Flex,
                options:{
                    data: this._pages,
                    direction:"horizontal",
                    item:{
                        view:controls.Button,
                        options:{
                            links:{
                                text:"data@page", 
                                css: { source: this, event: "page",  handler: (current, _prev, _, controller) => {
                                    const {page} = controller.data?.get() ?? {};
                                    let backgroundColor = null, color = null;
                                    if (current === page) {
                                        backgroundColor = "#1274AC";
                                        color = "#fff";
                                    }
                                    return { "background-color": backgroundColor, color };
                                } } 
                            },
                            events:{ click:{ handler:(_,button)=>{
                                this.set({page:+button.get("text")})
                            }}}
                        }
                    }
                }
            },
            next: {
                view: controls.Button,
                options: {
                    title:"next",
                    links: {
                        enable:{source:"parent", event:["page","totalCount","pageSize"], handler:({page,totalCount,pageSize})=>{
                            return page < ( Math.ceil( totalCount / pageSize ) );
                        }},
                        icon:{ source:"self", event:"enable", handler:val=>{
                            if (val){
                                return `url("${ previousBlue }")`;
                            }else{
                                return `url("${ previous }")`;
                            }
                        }}
                    },
                    events:{
                        click:{target:"parent@page", handler:()=> (this._options.page??0) + 1  }
                    }
                }
            },
            last: {
                view: controls.Button,
                options: {
                    title:"next",
                    links: {
                        enable:{source:"parent", event:["page","totalCount","pageSize"], handler:({page,totalCount,pageSize})=>{
                            return page < ( Math.ceil( totalCount / pageSize ) );
                        }},
                        icon:{ source:"self", event:"enable", handler:val=>{
                            if (val){
                                return `url("${ firstBlue }")`;
                            }else{
                                return `url("${ first }")`;
                            }
                        }}
                    },
                    events:{
                        click:{target:"parent@page", handler:()=> Math.ceil( (this._options.totalCount??0) / (this._options.pageSize??1) )  }
                    }
                }
            },
            pageSize: {view: controls.Dropdown, options: {
                hideClear:true,
                items:  this.get("pageSizeValues"),
                links: { value: "parent@pageSize" },
                events: { value: "parent@pageSize" }
            }},
            total:{view: primitives.Label, options: {
                links: { text: {source:"parent", event:["page","totalCount","pageSize"], handler:({page,totalCount,pageSize})=>{
                    pageSize = pageSize ?? totalCount;
                    const first = (page -1) * pageSize + 1;
                    const last = first + pageSize - 1;
                    return `${ first } - ${ last } / ${ totalCount }`
                }}}
            }}
        }
    }
}
Pager.extend();
