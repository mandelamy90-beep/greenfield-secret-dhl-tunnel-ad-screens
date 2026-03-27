export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Get status from KV
    if (url.pathname === "/status") {
      let status = await env.SIGNAGE_KV.get("status") || "off";
      return new Response(status);
    }

    // Set status
    if (url.pathname === "/set") {
      let mode = url.searchParams.get("mode");
      if (mode) {
        await env.SIGNAGE_KV.put("status", mode);
      }
      return new Response("OK");
    }

    // Serve index
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(indexHTML, {
        headers: { "content-type": "text/html" }
      });
    }

    // Serve screen
    if (url.pathname === "/screen.html") {
      return new Response(screenHTML, {
        headers: { "content-type": "text/html" }
      });
    }

    return new Response("Not found", { status: 404 });
  }
};

const indexHTML = `
<!DOCTYPE html>
<html>
<head>
<title>Control Dashboard</title>
<style>
body { font-family: Arial; background:#111; color:white; text-align:center; }
button { padding:20px; margin:10px; font-size:20px; }
#status { margin:20px; font-size:24px; }
</style>
</head>
<body>
<h1>Signage Control</h1>
<div id="status">Status: Loading...</div>

<button onclick="setMode('on')">ON</button>
<button onclick="setMode('off')">OFF</button>
<button onclick="setMode('blank')">BLANK</button>

<script>
async function updateStatus(){
  let res = await fetch('/status');
  let text = await res.text();
  document.getElementById('status').innerText = "Status: " + text.toUpperCase();
}
async function setMode(mode){
  await fetch('/set?mode=' + mode);
  updateStatus();
}
setInterval(updateStatus, 2000);
updateStatus();
</script>
</body>
</html>
`;

const screenHTML = `
<!DOCTYPE html>
<html>
<head>
<style>
body {
  margin:0;
  background:black;
  width:352px;
  height:224px;
  overflow:hidden;
}
#logo {
  position:absolute;
  top:50%;
  left:50%;
  transform:translate(-50%,-50%);
  display:none;
}
#media {
  width:352px;
  height:224px;
}
</style>
</head>
<body>

<img id="logo" src="/logo.png" width="150">
<img id="media">
<video id="video" width="352" height="224" autoplay muted></video>

<script>
let ads = [
  "/ads/ad1.jpg",
  "/ads/ad2.jpg",
  "/ads/ad3.mp4"
];

let index = 0;

async function getStatus(){
  let res = await fetch('/status');
  return await res.text();
}

async function startupSequence(){
  let media = document.getElementById("media");
  media.src = "/startup1.png";
  await new Promise(r=>setTimeout(r,1000));
  media.src = "/startup2.png";
  await new Promise(r=>setTimeout(r,1000));
}

async function cycleAds(){
  let img = document.getElementById("media");
  let vid = document.getElementById("video");

  let file = ads[index];
  index = (index + 1) % ads.length;

  if(file.endsWith(".mp4")){
    img.style.display="none";
    vid.style.display="block";
    vid.src = file;
    vid.play();
    setTimeout(cycleAds, 5000);
  } else {
    vid.style.display="none";
    img.style.display="block";
    img.src = file;
    setTimeout(cycleAds, 5000);
  }
}

async function loop(){
  let status = await getStatus();

  let logo = document.getElementById("logo");
  let img = document.getElementById("media");
  let vid = document.getElementById("video");

  if(status === "off"){
    logo.style.display="none";
    img.style.display="none";
    vid.style.display="none";
  }
  else if(status === "blank"){
    logo.style.display="block";
    img.style.display="none";
    vid.style.display="none";
  }
  else if(status === "on"){
    logo.style.display="none";
    img.style.display="block";
    await startupSequence();
    cycleAds();
  }

  setTimeout(loop, 5000);
}

loop();
</script>

</body>
</html>
`;
