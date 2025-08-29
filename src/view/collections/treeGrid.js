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
import style from "./treeGrid.css";
import folderIcon from "./grid/img/folder_icon.svg";
import fileIcon from "./grid/img/file_icon.svg";
import {deepCopy, deepMerge} from "../../utilities/data";
import icon_search from "../../img/zoom.png";
import {text as i18n} from "../../i18n/i18n.js";

export class TreeGrid extends ItemView{

    static events = {
        onSelect: true,
        rowDblClick: true
    }

    static options = {
        ...Grid.options,
        getSubitems:{type:types.primitives.Fun, required:true},
        isFolder:{type:types.primitives.Fun},
        getIcon:{type:types.primitives.Fun},
        itemName:{type:types.primitives.Fun},
        contextPath:{type:types.primitives.Array,default:[]},
        search:{type:types.primitives.Fun},
        getItemContext:{type:types.primitives.Fun}
    };

    static markup = `<div class="${ mainStyles.vertical } ${ style.container }">
        <div class="${ style.toolbar }">
            <div class="${ style.breadcrumbs }" name="breadcrumbs"></div>
            <div name="search_bar" style="flex-grow:1"></div>
            <div name="search_icon"></div>
        </div>
        <div name="grid" class="${ style.grid } item_treeGrid_table"></div>
    </div>`;


    widgets(){

        //----------Wrap the user widget into ThreeCell--------------------
        this._gridOptions = this.get();
        this._gridOptions.row = deepMerge({getSubitems: this._options.getSubitems}, this._gridOptions.row  );
        this._gridOptions.columns[0] = {
            view: TreeCell,
            options: {
                cell: Grid.compileColumn( this._gridOptions.columns[0] ),
                getSubitems: this._options.getSubitems,
                isFolder: this._options.isFolder,
                getIcon: this._options.getIcon,
                links:{
                    isExpanded: "parent@isUnfolded"
                },
                events:{
                    drillDown:( path )=>this.set({contextPath: [...this._options.contextPath, ...path] } )
                }
            }
        };

        //-------------Proxy grid events--------------------------
        this._gridOptions.events = Object.fromEntries(["onSelect","rowDblClick"].map(e => {
            return [e, (...args)=>this._trigger(e,args) ]
        }));

        //--------Init breadcrumbs---------------------------------
        this._breadCrumbsController = new controllers.Collection({
            id:"id",
            schema:{ 
                id:{ type: types.primitives.Integer }, 
                caption:{type: types.primitives.String}
            },
            orderBy:[["id","asc"]],
            data:[{id:0, caption:""}]
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
                    links: {
                        visible: { source: "data", event:"$.totalCount", handler:v => v > 1 }
                    },
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
            },
            search_bar:{
                view:SearchBar,
                options:{
                    visible:false,
                    events:{
                        onSearch:(val)=>{
                            this.search(val);
                        },
                        onClose:()=>this.resetSearch()
                    }
                }
            },
            search_icon:{
                view: controls.Button,
                options:{
                    visible: !!(this._options.search && this._options.getItemContext),
                    icon: `url("${icon_search}")`,
                    events:{
                        click:() => {
                           this.openSearchBar( true );
                        }
                    }
                }
            }
        }

    }

    openSearchBar( value ) {
        this._widgets.breadcrumbs.set({"visible": !value});
        this._widgets.search_bar.set({"visible": value});
        this._widgets.search_icon.set({"visible": !value});
    }

    search( value ) {
        const controller = this._options.search( value, this._options.contextPath );
        if (!controller) return;
        this._grid?.destroy();
        const _options = deepCopy(this._gridOptions);
        _options.columns[0] = {
            view: SearchCell,
            options:{
                cell: _options.columns[0].options.cell,
                links:{
                    itemPath:{source: "data", event:[], handler:async(item)=>{
                        if (!this._options.itemName) return "undefined";
                        try{
                            const list = [];
                            while (item) {
                                list.push(this._options.itemName(item));
                                item = await this._options.getItemContext( item );
                            }
                            list.shift();
                            return "/"+list.reverse().join("/");
                        }catch(e){
                            console.error(e);
                            return "undefined";
                        }
                    }},
                    icon:{source:"data", event:[],handler:(item) =>{
                        let icon = undefined;
                        if (typeof this._options.getIcon === "function"){
                            icon = this._options.getIcon( item );
                        }
                        if (typeof icon !== "string"){
                            const _isFolder = this._options.isFolder && this._options.isFolder(item);
                            icon = _isFolder ? folderIcon : fileIcon;
                        }
                        return icon;
                    }}
                }
            }
        }
        this._grid = new Grid({
            ..._options,
            $container: this.$markup.find('[name="grid"]'),
            data: controller,
            checkbox: false,
            numerated: false,
            events:{
                ..._options.events,
                rowDblClick:async row=>{
                    try {
                        let item = row.get("data").get();
                        const _isFolder = this._options.isFolder && this._options.isFolder(item);
                        if (!_isFolder) return this._trigger("rowDblClick", [row]);;

                        this.openSearchBar( false );
                        
                        const path = [];
                        while (item) {
                            path.push(item);
                            item = await this._options.getItemContext( item );
                        }
                        path.reverse();
                        this.set({"contextPath": path});
                    }catch(e){
                        console.error(e);
                        this._contextPath( this._options.contextPath );
                    }
                },
                destroy:()=> controller.destroy()
            }
        });
    }

    resetSearch(){
        this._widgets.breadcrumbs.set({"visible": true});
        this._widgets.search_bar.set({"visible": false, value:""});
        this._widgets.search_icon.set({"visible": true});
        if (!(this._grid.get("columns")[0].view instanceof TreeCell)) {
            this._contextPath( this._options.contextPath );
        }
    }

    getSelected(){
        return this._grid?.getSelected();
    }

    getRows(){
        return this._grid?.getRows();
    }

    getContext(){
        return this._grid?.getContext();
    }

    refresh(){
        this._grid?.refresh();
    }

    linkWidgets( context ){
        super.linkWidgets( context );
        this._grid?.link( {...context,parent:this} );
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
        if (this._grid){
            this._trigger("onSelect",[[]]);
            this._grid.destroy();
        }
        if ( path.length > 0 ){
            const controller = this._options.getSubitems( path[path.length - 1] );
            this._grid = new Grid({
                ...this._gridOptions,
                $container: this.$markup.find('[name="grid"]'),
                data: controller,
                events:{...this._gridOptions.events, destroy:()=> controller.destroy() }
            });
        }else{
            this._grid = new Grid({
                ...this._gridOptions,
                $container: this.$markup.find('[name="grid"]'),
                data: this._options.data
            });
        }

    }

    unfold( row ){
        const itemController = row.get("data");
        const item = itemController.get();
        if (this._options.isFolder && this._options.isFolder( item ) ){
            row.unfold();
        }
    }

    fold( row ){
        row.fold();
    }

    _destroy() {
        this._breadCrumbsController?.destroy();
        this._grid?.destroy();
        super._destroy();
    }

}
TreeGrid.extend();

class SearchBar extends ItemView{
    static events = {
        onSearch: true,
        onClose: true
    }

    static options = {
        value:{type:types.primitives.String}
    }

    static markup = `<div class="${style.search_bar}">
        <div name="search_bar_wrapper">
            <input type="text" placeholder="${i18n("Search")}..."/>
            <div name="close" class="${style.close_search}"></div>
        </div>
        <div name="searcher" class="${style.searcher}"></div>
    </div>`;

    constructor( options ){
        super( options );

        this.$markup.find('[name="close"]').on("click", ()=>this._trigger("onClose"));

        const $input = this.$markup.find('input');
        const $searcher = this.$markup.find('[name="searcher"]');

        this.bind("visible", ()=>$input.val(null));

        this.bind("value", (value)=>$input.val(value));

        $searcher.on("click", event =>{
            event.preventDefault();
            this.set({value:$input.val()});
            this._trigger("onSearch", $input.val());
        })
        $input.on("keypress", event=>{
            if (event.which === 13){
                event.preventDefault();
                this.set({value:$input.val()});
                this._trigger("onSearch", $input.val());
            }
        });
    }
}
SearchBar.extend();

class SearchCell extends ItemView{

    static options = {
        cell: {type: types.primitives.Any},
        icon:{type:types.primitives.String, default: fileIcon},
        itemPath:{type:types.primitives.String}
    }
    
    static markup = `<div>
        <div style="display: flex;">
            <div name="icon" style="margin-right: 12px;"></div>
            <div name="cell"></div>
        </div>
        <div name="context_path"></div>
    </div>`;

    widgets() {
        return {
            icon:{
                view:Html,
                options: {
                    links:{
                        html:{source:"parent@icon", handler:icon=>{
                            const $icon=$(`<div class="${style.icon}"></div>`);
                            $icon.css({"background-image": icon});
                            return $icon;
                        }}
                    }
                }
            },
            cell:this._options.cell,
            context_path:{
                view:Html,
                options:{
                    links:{
                        html:"parent@itemPath"
                    }
                }
            }
        }
    }
}
SearchCell.extend();

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

    static markup = `<div class="${style.treeCell}">
        <div name="offset"></div>
        <div name="expand"></div>
        <div name="icon"></div>
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
                        css:{source:"parent", event:"isExpandable", handler: (val)=>{
                            return {opacity: val ? 1 : 0 };
                        }}
                    },
                    events: {
                        click:()=>{
                            if (!this._options.isExpandable) return;
                            if (!this.#parent) return;
                            if (this._options.isExpanded){
                                this._widgets.total?.destroy();
                                this.#parent.fold();
                            }else if(this.#data){
                                this.#parent.unfold();
                                const children = this.#parent.get("children");
                                this._widgets.total = new Label({ $container: this.$markup.find('[name=total]'), data: children, links:{text: {
                                    source: "$.totalCount",
                                    handler:(totalCount)=>this.formatTotalCount(totalCount)
                                }}});

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
                            const $icon = $(`<div class="${style.icon}"></div>`);
                            $icon.css({"background-image": icon ?? fileIcon});
                            return $icon;
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
            this.$offset.width(level * 20);

            this.#parent.bind("dblClick",()=>{
                if (this._options.isExpandable){
                    const path = this.#parent.getPath().map(r => r.get("data").get());
                    if (path) this._trigger("drillDown",[path]);
                }
            })
        }
        if (!this.#data && context.data){
            this.#data = context.data;

            this.set({ isExpandable:this._options.isFolder ? this._options.isFolder( this.#data.get() ) : false });

            const setIcon=()=>{
                let icon = undefined;
                if (typeof this._options.getIcon === "function"){
                    icon = this._options.getIcon( this.#data.get() );
                }
                if (typeof icon !== "string"){
                    icon = this._options.isExpandable ? `url(${folderIcon})` : `url(${fileIcon})`;
                }
                this.set({icon});
            };
            this.#data.bind("change",()=>setIcon());
            setIcon();
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
