
import {view} from "../index";
import {types} from "../../types";
import {controllers} from "../../controllers";

import style from "./breadcrumbs.css";

const itemSchema = {
    title:{ type:types.primitives.String, required:true },
    callback:{ type:types.primitives.Fun, required: true },
    level:{ type:types.primitives.Array },
    index:{ type:types.primitives.Integer }
}

export class Breadcrumbs extends view.Item{

    static options = {
        initPath: { type:types.complex.Collection, options:{ schema:itemSchema }, default: []}
    };

    static markup = `<div name="path" class="${style.breadcrumbs}"></div>`;


    widgets(){

        const initPath = this._options.initPath.map((item, index) => ({ ...item, index }));

        const pathController = new controllers.Collection({
            schema: itemSchema,
            data: initPath
        });

        const onActivate = (activeIndex) => {
            const items = pathController.get();
            const reset = {};
            for (const index of Object.keys(items)){
                if (index > activeIndex) reset[index] = null
            }
            pathController.set( reset );
        }

        return {
            path:{
                view: view.collections.Flex,
                options:{
                    data: pathController,
                    direction:"horizontal",
                    item:{
                        view:PathItem,
                        options:{
                            events:{ activate: onActivate }
                        }
                    }
                }
            }
        }
    }
}
Breadcrumbs.extend();

class PathItem extends view.Item{

    static markup = `<div class="${style.pathItem}">
        <div name="title" class="${style.title}"></div>
        <div name="expand" class="${style.expand}"></div>
    </div>`;


    widgets(){
        return {
            title:{
                view: view.primitives.Label,
                options:{
                    links:{

                    }
                }
            }
        }
    }
}
Breadcrumbs.extend();
