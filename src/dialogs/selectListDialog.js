import {item} from "../index.js"

export function selectList( items, options ){

    const data = new item.controllers.Item({
        autoCommit:false,
        schema:{
            value: {type: item.types.primitives.Array, required:true},
        },
        data:{value:[]}
    });

    return new Promise((resolve, reject) =>{

        let form;

        const commit = async(data) =>{
            await data.commit();
            const selected = data.get("value");
            form?.destroy();
            data?.destroy();
            resolve(selected)
        }

        const rollback = () =>{
            form?.destroy();
            reject()
        }

        form = new item.view.layout.Window({
            actions:["close"],
            minWidth:300,
            minHeight:100,
            view:{
                view:item.view.layout.Form,
                options:{
                    view:{
                        view:item.view.controls.SelectList,
                        options:{
                            items:items,
                            value:[],
                            ...options,
                            events: {value: "data@value"}
                        }
                    },
                    data,
                    commit,
                    rollback,
                    events:{ error:item.dialogs.error }
                }
            }
        });
    })
}