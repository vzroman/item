
import {View as Item} from "../item";
import {collections} from "../collections";
import {primitives} from "../primitives";
import {types} from "../../types";
import {controllers} from "../../controllers";

import style from "./breadcrumbs.css";

const itemSchema = {
    title:{ type:types.primitives.String, required:true },
    callback:{ type:types.primitives.Fun, required: true },
    icon:{ type:types.primitives.String },
    levelItems:{ type:types.primitives.Array },
    index:{ type:types.primitives.Integer }
}

export class Breadcrumbs extends Item{

    static options = {
        initPath: { type:types.complex.Collection, options:{ schema:itemSchema }, default: []}
    };

    static markup = `<div name="path" class="${style.breadcrumbs} item_breadcrumbs"></div>`;


    widgets(){

        const initPath = this._options.initPath.map((item, index) => ({ ...item, index }));

        this._pathController = new controllers.Collection({
            schema: itemSchema,
            data: initPath
        });


        return {
            path:{
                view: collections.Flex,
                options:{
                    data: this._pathController,
                    direction:"horizontal",
                    item:{
                        view:PathItem,
                        options:{
                            events:{ activate:(index)=>this.onActivate(index) }
                        }
                    }
                }
            }
        }
    }

    onActivate( {index: activeIndex, callback } ){
        const items = this._pathController.get();
        for (const index of Object.keys(items)){
            if (index > activeIndex) items[index] = null
        }
        this._pathController.set( items );
        callback();
    }

    expandLevel( path ){
        const items = this._pathController.get();
        const from = Object.keys(items).length;
        path.forEach((item, i)=>{
            const index = i + from;
            items[index]= {...item, index }
        });
        this._pathController.set( items );
    }
}
Breadcrumbs.extend();

class PathItem extends Item{

    static events ={
        activate:true
    }

    static markup = `<div class="${style.pathItem} item_breadcrumbs_item">
        <div name="title" class="${style.title} item_breadcrumbs_item_title"></div>
        <div name="expand"></div>
        <div class="${ style.delimiter }">/</div>
    </div>`;


    widgets(){

        setTimeout(()=>{
            if (!this._options.data.get("levelItems")){
                this.$markup.find('[name="expand"]').hide();
            }
        });

        return {
            title:{
                view: primitives.Label,
                options:{
                    links:{ text:"title" },
                    events:{ click:()=> this.activate() }
                }
            },
            expand:{
                view: primitives.Html,
                options:{
                    html: `<div class="${style.expand} item_breadcrumbs_item_expand"></div>`,
                    events:{ click:()=> this.expand()   }
                }
            }
        }
    }

    activate(){
        const index = this._options.data.get("index");
        this._trigger("activate", [index] );
    }

    expand(){

        const _item = this._options.data.get();
        const items = _item.levelItems;

        const $levelItems = $(`<div class="${ style.expand_level }"></div>`).appendTo( this.$markup );

        const levelItems = new LevelItems({
            $container: $levelItems,
            items: items,
            events:{
                activate:( index )=>{
                    hideLevelItems();
                    const levelItem = items[index];
                    levelItem.levelItems = [...items];
                    levelItem.levelItems.splice(index,1);
                    delete _item.levelItems;
                    levelItem.levelItems.unshift({..._item});
                    this._options.data.set( levelItem );
                    this.activate();
                }
            }
        });

        const clickLickListener = event =>{
            if (!$levelItems[0].contains(event.target)) { // or use: event.target.closest(selector) === null
                hideLevelItems();
            }
        }

        const hideLevelItems = () => {
            removeClickListener();
            levelItems.destroy();
            $levelItems.remove();
        }

        const removeClickListener = () => document.removeEventListener('click', clickLickListener);
        document.addEventListener('click', clickLickListener);

    }
}
Breadcrumbs.extend();

class LevelItems extends Item{

    static options = {
        items: { type:types.complex.Collection, options:{ schema:itemSchema }, required:true }
    }

    static events ={
        activate:true
    }

    static markup = `<div name="items"></div>`;

    widgets() {

        const items = this._options.items.map((item, index) =>({ ...item, index }));

        console.log("items", items);

        const itemsController = new controllers.Collection({
            schema: itemSchema,
            data: items
        });

        return {
            items:{
                view: collections.Flex,
                options:{
                    data: itemsController,
                    direction:"vertical",
                    item:{
                        view: primitives.Label,
                        options:{
                            classes:[style.title],
                            links:{ text:"title" },
                            events:{ click:( event, label)=> {
                                const index = label.get("data").get("index");
                                console.log("index",index);
                                this._trigger("activate",[ index ])
                            }}
                        }
                    }
                }
            }
        };
    }

}
LevelItems.extend();
