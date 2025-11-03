
import {item} from "../dist/item.js";

export async function run( $container ){

    const progress = await item.util.progressBar();

    setTimeout(()=>{
        progress.setValue(10)
    }, 200);

    setTimeout(()=>{
        progress.setValue(20)
    }, 400);

    setTimeout(()=>{
        progress.setValue(30)
    }, 600)

    setTimeout(()=>{
        progress.setValue(40)
    }, 800)

    setTimeout(()=>{
        progress.setValue(50)
    }, 1000)

    setTimeout(()=>{
        progress.setValue(60)
    }, 1200)

    setTimeout(()=>{
        progress.setValue(70)
    }, 1400)

    setTimeout(()=>{
        progress.setValue(80)
    }, 1600)

    setTimeout(()=>{
        progress.setValue(90)
    }, 1800)

    setTimeout(()=>{
        progress.setValue(100)
    }, 2000)

    setTimeout(()=>{
        progress.destroy()
    }, 2200)


}