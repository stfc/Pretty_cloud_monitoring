var max_clouds = 10;
var bubbles_enabled = 1;
function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
  results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}
if ( getParameterByName( "max" ) ) {
  max_clouds = getParameterByName( "max" );
}
if ( getParameterByName( "bubbles" ) ) {
  bubbles_enabled = getParameterByName( "bubbles" );
}

function format_size(info){
  out = info.alloc_cpu * info.alloc_mem;
  out = Math.sqrt(Math.sqrt(out));
  out = out / 5;
  out = out * 12;
  out = out + 6;
  return(Math.floor(out));
}
function format_text(div, info){
  $(div).empty();
  p_name = document.createElement("p");
  p_util = document.createElement("p");
  p_cpus = document.createElement("p");
  p_mem = document.createElement("p");
  p_name.id = "vm_info";
  p_util.id = "vm_info";
  p_cpus.id = "vm_info";
  p_mem.id = "vm_info";
  $(p_name).text("Name: " + info.name);
  $(p_util).text("Util: " + String(Math.round(info.util*10000)/10000) + "%");
  $(p_cpus).text("CPUs: " + info.alloc_cpu);
  $(p_mem).text("Mem : " + info.alloc_mem + "GB");
  $(div).append(p_name);
  $(div).append(p_util);
  $(div).append(p_cpus);
  $(div).append(p_mem );

}

var status;
var load;
var vms_array = [];
setInterval(update_json,10000);
function update_json(){
  $.getJSON("pretty-stats.json",function(data){
    if(status !== data.status){
      status = data.status;
      if(data.status == "ok"){
        $("#main_cloud").attr("src", "sprites/ok.gif");
      }
      else if (data.status == "degraded") {
        $("#main_cloud").attr("src", "sprites/degraded.gif");
      }
      else{
        $("#main_cloud").attr("src", "sprites/down.gif");
      }
    }
    load = data.load;
    $("#motd").text(data.message);
    vms_array = data.vms;
  });
}

var bg_array = [];
function preload(){
  update_json();
  if(!status){
    setTimeout(preload,100)
  }
  else{
    for (i = 0; i < max_clouds; i++){
      var data_dict = {};
      var vm_info = vms_array[Math.floor(Math.random() * vms_array.length)];
      var img = document.createElement("img");

      data_dict.vm_info = vm_info;
      data_dict.img = img;

      img.id = "bg_cloud";
      img.src = "sprites/bg_cloud.png";

      var size = format_size(vm_info);
      var top = Math.floor(Math.random() * (100 - size));
      var cloud_top = String(top) + "%";
      var duration = String((Math.random()*15)+10) + "s";
      var delay = String(-(Math.random()*20)) + "s";

      img.style.top = cloud_top;
      img.style.animationDuration = duration;
      img.style.animationDelay = delay;
      img.style.height = String(size) + "vh";
      img.style.filter = "brightness(" + String(1 - (vm_info.util / 270)) + ")";

      img.addEventListener("animationiteration", function(){
        for(i = 0; i < bg_array.length; i++){
          if(bg_array[i].img == this){
            bg_array[i].vm_info = vms_array[Math.floor(Math.random() * vms_array.length)];
            var new_size = format_size(bg_array[i].vm_info);
            var new_top = Math.floor(Math.random() * (100 - new_size));
            if(new_top < 25){
              var new_bubbl_top = String(new_top + new_size + 1) + "%";
              var new_text_top = String(new_top + new_size + 4.5) + "%"
              bg_array[i].bbl.style["transform"] = "scaleY(-1)"
            }
            else{
              var new_bubbl_top = String(new_top - 20.5) + "%";
              var new_text_top = String(new_top - 20.5) + "%";
              bg_array[i].bbl.style["transform"] = "scaleY(1)"
            }

            bg_array[i].img.style.top = String(new_top) + "%";
            bg_array[i].img.style.height = String(new_size) + "vh";
            bg_array[i].img.style.filter = "brightness(" + String(1 - (bg_array[i].vm_info.util / 270)) + ")";
            if(parseInt(bubbles_enabled)){
              bg_array[i].bbl.style.top = new_bubbl_top;
              bg_array[i].txt.style.top = new_text_top;
              format_text(bg_array[i].txt, bg_array[i].vm_info);
            }
          }
        }
      }, false);

      if(parseInt(bubbles_enabled)){
        var bbl = document.createElement("img");
        var txt = document.createElement("div");

        data_dict.bbl = bbl;
        data_dict.txt = txt;

        bbl.id = "vm_bubble";
        txt.id = "vm_bubble";
        bbl.src = "sprites/bg_bubble.png";
        format_text(txt, vm_info);

        if(top < 25){
          var bubbl_top = String(top + size + 1) + "%";
          var text_top = String(top + size + 4.5) + "%";
          bbl.style.transform = "scaleY(-1)";
        }
        else{
          var bubbl_top = String(top - 20.5) + "%";
          var text_top = String(top - 20.5) + "%";
          bbl.style.transform = "scaleY(1)";
        }

        bbl.style.top = bubbl_top;
        txt.style.top = text_top;
        bbl.style.height = "20vh";
        bbl.style.animationDuration = duration;
        txt.style.animationDuration = duration;
        bbl.style.animationDelay = delay;
        txt.style.animationDelay = delay;

        img.onclick = function(){
          for(i = 0; i < bg_array.length; i++){
            if(bg_array[i].img == this){
              $(bg_array[i].img).toggleClass("clicked");
              $(bg_array[i].bbl).toggleClass("clicked");
              $(bg_array[i].txt).toggleClass("clicked");
            }
          }
        }

        $("body").append(bbl);
        $("body").append(txt);
      }
      $("body").append(img);
      bg_array.push(data_dict);
    }
  }
}
