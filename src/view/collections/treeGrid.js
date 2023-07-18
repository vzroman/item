//------------------------------------------------------------------------------------
// MIT License
//
// Copyright (c) 2023 vzroman
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

import {View as ItemView} from "../item";
import {types} from "../../types/index.js";
import {Grid} from "./grid";
import {View as Flex} from "./flex";
import mainStyles from "../../css/main.css"
import {Label} from "../primitives/label";
import { controllers } from "../../controllers";
import { controls } from "../controls";
import {Html} from "../primitives/html";
import style from "./grid.css";
import folderIcon from "./grid/img/icon_folder.png";
import fileIcon from "./grid/img/icon_file.png";

export class TreeGrid extends ItemView{

    static options = {
        ...Grid.options,
        getSubitems:{type:types.primitives.Fun},
        isFolder:{type:types.primitives.Fun},
        getIcon:{type:types.primitives.Fun},
        itemName:{type:types.primitives.Fun},
        contextPath:{type:types.primitives.Array,default:[]}
    };

    static markup = `<div class="${ mainStyles.vertical }" style="height: 100%; width:100%">
        <div name="breadcrumbs" style="display:flex"></div>
        <div name="grid" style="flex-grow: 1"></div>
    </div>`;

    constructor( options ) {


        super( options );
    }

    widgets(){

        //----------Wrap the user widget into ThreeCell--------------------
        this._gridOptions = this.get();
        this._gridOptions.columns[0] = {
            view: TreeCell,
            options: {
                cell: this._gridOptions.columns[0],
                getSubitems: this._options.getSubitems,
                isFolder: this._options.isFolder,
                getIcon: this._options.getIcon,
                events:{
                    drillDown:( path )=>this.set({contextPath: [...this._options.contextPath, ...path] } )
                }
            }
        };

        //--------Init breadcrumbs---------------------------------
        this._breadCrumbsController = new controllers.Collection({
            id:"id",
            schema:{ 
                id:{ type: types.primitives.Integer }, 
                caption:{type: types.primitives.String}
            },
            keyCompare:([a],[b])=>{
                a = +a;
                b = +b;
                if ( a > b ) return 1;
                if ( a < b ) return -1;
                return 0;
            },
            data:[{id:0, caption:"/"}]
        });

        //--------Subscribe to the path---------------------------------
        this.bind("contextPath", path =>{
            this._contextPath( path );
        });

        return {
            //grid:{ view:Grid, options:this._gridOptions }, the grid will be created dynamically on changing contextPath
            breadcrumbs:{
                view:Flex,
                options:{
                    data: this._breadCrumbsController,
                    direction:"horizontal",
                    item:{
                        view:controls.Button,
                        options:{
                            links:{text:"data@caption" },
                            events:{ click:{ handler:(_,button)=>{

                                const idx = button.get("data").get("id");
                                const path = this._options.contextPath.slice(0, +idx);
                                this.set({contextPath:path});

                            }}}
                        }
                    }
                }
            }
        }

    }

    _contextPath( path ) {

        // ----------update breadcrumbs------------------------------
        const set = this._breadCrumbsController.get();
        delete set["0"];
        for (const k in set){
            set[k] = null;
        }
        for (let i=0; i < path.length; i++){
            const caption = typeof this._options.itemName === "function" ? this._options.itemName( path[i]) : `Item ${i+1}`;
            set[i+1] = {id:i+1, caption, item: path[i] };
        }

        this._breadCrumbsController.set(set);

        //--------init grid------------------------------------------
        this._grid?.destroy();
        if ( path.length > 0 ){
            const controller = this._options.getSubitems( path[path.length - 1] );
            this._grid = new Grid({
                ...this._gridOptions,
                $container: this.$markup.find('[name="grid"]'),
                data: controller,
                events:{ destroy:()=> controller.destroy() }
            });
        }else{
            this._grid = new Grid({
                ...this._gridOptions,
                $container: this.$markup.find('[name="grid"]'),
                data: this._options.data
            });
        }

    }

    destroy() {
        this._breadCrumbsController?.destroy();
        this._grid?.destroy();
        super.destroy();
    }

}
TreeGrid.extend();

class TreeCell extends ItemView{

    static options = {
        cell: {type: types.primitives.Any},
        getSubitems:{type:types.primitives.Fun},
        isFolder:{type:types.primitives.Fun},
        getIcon:{type:types.primitives.Fun},
        icon:{type:types.primitives.String},
        isExpandable:{type:types.primitives.Bool, default:false },
        isExpanded:{type:types.primitives.Bool, default:false }
    };

    static events = {
        drillDown: true
    }

    #parent;
    #data;

    constructor( options ) {
        options.cell = Grid.compileColumn( options.cell );
        super( options );
    }

    static markup = `<div class="${style.treeCell}">
        <div name="offset"></div>
        <div name="expand"></div>
        <div name="icon">icon</div>
        <div name="cell"></div>
        <div name="total" style="margin-left: auto"></div>
    </div>`;

    widgets() {

        this.$offset = this.$markup.find('[name=offset]');

        // We stop the event because we don't want the row become selected
        // on expanding
        this.$markup.find('[name=expand]').on("mousedown mouseup", e=>{
            e.stopPropagation();
            e.preventDefault();
        })
        return {
            expand:{
                view:Label,
                options: {
                    links:{
                        text:{source:"parent", event:["isExpandable","isExpanded"], handler:({isExpandable,isExpanded})=>{
                            if (isExpanded) return "-";
                            if (isExpandable) return "+";
                            return " "
                        }},
                        opacity:{source:"parent", event:"isExpandable", handler: (val)=>{
                            return val ? "1" : "0";
                        }}
                    },
                    events: {
                        click:()=>{
                            if (!this._options.isExpandable) return;
                            if (!this.#parent) return;
                            if (this._options.isExpanded){
                                this._widgets.total?.destroy();
                                this.#parent.fold();
                                this.set({isExpanded:false});
                            }else if(this.#data){
                                const controller = this._options.getSubitems( this.#data.get() );
                                this._widgets.total = new Label({ $container: this.$markup.find('[name=total]'), data: controller, links:{text: {
                                    source: "$.totalCount",
                                    handler:(totalCount)=>this.formatTotalCount(totalCount)
                                }}});
                                this.#parent.unfold( controller );
                                this.set({isExpanded:true});
                            }

                        }
                    }

                }
            },
            icon:{
                view:Html,
                options: {
                    links:{
                        html:{source:"parent", event: ["icon"], handler:({icon})=>{
                            return `<div style="background-image: url(${icon})" class="${style.icon}"></div>`
                        }}
                    }
                }
            },
            cell:this._options.cell
        }

    }

    link( context ){

        super.link( context );

        if (!this.#parent && context.parent){
            this.#parent = context.parent;
            let level = 0, row = this.#parent.get("parentRow");
            while ( row ){
                level++;
                row = row.get("parentRow");
            }
            this.$offset.width(level * 5);

            this.#parent.bind("dblClick",()=>{
                if (this._options.isExpandable){
                    const path = this.#parent.getPath().map(r => r.get("data").get());
                    if (path) this._trigger("drillDown",[path]);
                }
            })
        }
        if (!this.#data && context.data){
            this.#data = context.data;

            this.set({ isExpandable:this._options.isFolder ? this._options.isFolder( this.#data ) : false });

            if (this._options.getIcon){
                const setIcon=()=>{
                    let icon = undefined;
                    if (typeof this._options.getIcon === "function"){
                        icon = this._options.getIcon( this.#data );
                    }
                    if (typeof icon !== "string"){
                        icon = this._options.isExpandable ? `${folderIcon}` : `${fileIcon}`;
                    }
                    this.set({icon});
                };
                this.#data.bind("change",()=>setIcon());
                setIcon();
            }
        }
    }

    formatTotalCount(value) {
        if (!value || typeof value!=="number") return "";
        let text = value.toString();
        const n = text.length;

        if(n > 6){
            text = text.substring(0, n - 6) + "kk...";
        } else if(n > 3){
            text = text.substring(0, n - 3) + "k...";
        }
        return text;
    }

}
TreeCell.extend();
