
import {
    PCFSoftShadowMap,
    MeshPhysicalMaterial,
    TextureLoader,
    FloatType,
    PMREMGenerator,
    Scene,
    PerspectiveCamera,
    WebGLRenderer,
    Color,
    ACESFilmicToneMapping,
    sRGBEncoding,
    Mesh,
    SphereGeometry,
    DirectionalLight,
    Clock,
    Vector3,
    PlaneGeometry,
    Group,
}from "https://cdn.skypack.dev/three@0.137";
import { OrbitControls } from "https://cdn.skypack.dev/three-stdlib@2.8.5/controls/OrbitControls";import { RGBELoader } from "https://cdn.skypack.dev/three-stdlib@2.8.5/loaders/RGBELoader";
import { GLTFLoader } from "https://cdn.skypack.dev/three-stdlib@2.8.5/loaders/GLTFLoader";
import anime from 'https://cdn.skypack.dev/animejs@3.2.1';

let sunBackground = document.querySelector(".sun-background");
let moonBackground = document.querySelector(".moon-background");

const scene = new Scene();

const camera = new PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 1000);
camera.position.set(0,15,50);

const renderer = new WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = ACESFilmicToneMapping;
renderer.outputEncoding = sRGBEncoding;
renderer.physicallyCorrectLights = true;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0,0,0);
controls.dampingFactor = 0.05;
controls.enableDamping = true;

// Positioning the sunlight at the top right of the screen
const sunLight = new DirectionalLight(
    new Color("#FFFFFF"),3.5);
    sunLight.position.set(10, 20, 10);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 512;
    sunLight.shadow.mapSize.height = 512;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 100;
    sunLight.shadow.camera.left = -10;
    sunLight.shadow.camera.bottom = -10;
    sunLight.shadow.camera.top = 10;
    sunLight.shadow.camera.right = 10;
    scene.add(sunLight);

  const moonLight = new DirectionalLight(new Color("#77ccff").convertSRGBToLinear(),0);
  moonLight.position.set(-10, 20, 10);
  moonLight.castShadow = true;
  moonLight.shadow.mapSize.width = 512;
  moonLight.shadow.mapSize.height = 512;
  moonLight.shadow.camera.near = 0.5;
  moonLight.shadow.camera.far = 100;
  moonLight.shadow.camera.left = -10;
  moonLight.shadow.camera.bottom = -10;
  moonLight.shadow.camera.top = 10;
  moonLight.shadow.camera.right = 10;
  scene.add(moonLight);

(async function () {
   
    let pmrem = new PMREMGenerator(renderer);
    let envmapTexture = await new RGBELoader()
    .setDataType(FloatType)
    .loadAsync("assets/qwantani_puresky_4k.hdr")
    let envMap = pmrem.fromEquirectangular(envmapTexture).texture;

    let textures = {
        
        bump: await new TextureLoader().loadAsync("assets/earthbump.jpeg"),
        map: await new TextureLoader().loadAsync("assets/earthmap.jpeg"),
        spec: await new TextureLoader().loadAsync("assets/earthspec.jpeg"),
        planeTrailMask: await new TextureLoader().loadAsync("assets/mask.png"),

      };

      let plane = (await new GLTFLoader().loadAsync("assets/plane/scene.glb")).scene.children[0];
      console.log(plane)
      let planeData = [
        makePlane(plane, textures.planeTrailMask, envMap, scene),
        makePlane(plane, textures.planeTrailMask, envMap, scene),
        makePlane(plane, textures.planeTrailMask, envMap, scene),
        makePlane(plane, textures.planeTrailMask, envMap, scene),
        makePlane(plane, textures.planeTrailMask, envMap, scene),
        makePlane(plane, textures.planeTrailMask, envMap, scene),
        makePlane(plane, textures.planeTrailMask, envMap, scene),
        makePlane(plane, textures.planeTrailMask, envMap, scene),
        makePlane(plane, textures.planeTrailMask, envMap, scene),
      ];
    
      // Creates the Globe and modifys the texture
      let sphere = new Mesh(
        new SphereGeometry(10, 70, 70),
        new MeshPhysicalMaterial({
            map:textures.map,
            roughnessMap:textures.spec,
            bumpMap:textures.bump,
            bumpScale: 0.10,
            envMap,
            envMapIntensity : 0.4,
            sheen: 1,
            sheenRoughness: 0.75,
            sheenColor: new Color("#ff8a00").convertSRGBToLinear(),
            clearcoat: 0.5,

        }),
        );
        sphere.sunEnvIntensity = 0.4;
        sphere.moonEnvIntensity = 0.1;
        sphere.rotation.y += Math.PI *1.25;
        sphere.receiveShadow = true;
        scene.add(sphere);
        
        let clock = new Clock();
        let daytime = true;
        let animating = false;

        window.addEventListener("mousemove", (e) => {
           
            if(animating) return;
    
            let anim = [0,1];

            // checks for mouse position of the user
            // if the mouse is on the left set it to moonligt
            // if the mouse is on the right set it to daylight
            if(e.clientX > (innerWidth - 200) && !daytime) {
                anim = [1, 0];
              } else if(e.clientX < 200 && daytime) {
                anim = [0, 1];
              } else {
                return;
              }

            if(!daytime) {
                anim = [1,0];
            }else if(daytime) {
                anim = [0,1];
            }else {
                return;
            }
            
            animating = true;


            let obj = { t:0};
        
            //change the background color with an animation
            //change the position of the sunlight and the moonlight
            anime({
                targets: obj,
                t: anim,
                complete: () => {
                    animating = false;
                    daytime = !daytime;
                },
                update: () => {
                    sunBackground.style.opacity = 1-obj.t;
                    moonBackground.style.opacity = obj.t;

                     sunLight.position.setY(20 * (1-obj.t));
                     moonLight.position.setY(20 * obj.t);

                     sphere.material.sheen = (1-obj.t);

                     scene.children.forEach((child) => {
                        child.traverse((object) => {
                          if(object instanceof Mesh && object.material.envMap) {
                            object.material.envMapIntensity = object.sunEnvIntensity * (1-obj.t) + object.moonEnvIntensity * obj.t;
                          }
                        });
                      });
                    
                     sunBackground.style.opacity = 1-obj.t;
                     moonBackground.style.opacity = obj.t;

                },
                easing: "easeInOutSine",
                duration: 500,

            });

        });

    // This function is executed every frame. 60fps -> 60 times a second
    renderer.setAnimationLoop(() => {
        
        let delta = clock.getDelta();
        controls.update();
        renderer.render(scene, camera);
        sphere.rotation.y += delta * 0.05;

        planeData.forEach(planeData => { 

        let plane = planeData.group;
    
        plane.position.set(0,0,0);
        plane.rotation.set(0,0,0);
        plane.updateMatrixWorld();

        planeData.rot += delta * 0.25;
        plane.rotateOnAxis(planeData.randomAxis, planeData.randomAxisRot);
        plane.rotateOnAxis(new Vector3(0,1,0), planeData.rot);
        plane.rotateOnAxis(new Vector3(0,0,1), planeData.rad);
        plane.translateY(planeData.yOff);
        plane.rotateOnAxis(new Vector3(1,0,0), + Math.PI * 0.5);
    });

       
});

})();

function makePlane(planeMesh, trailTexture, envMap, scene) {
    let plane = planeMesh.clone();
    plane.scale.set(0.001, 0.001, 0.001);
    plane.position.set(0,0,0);
    plane.rotation.set(0,0,0);
    plane.updateMatrixWorld();

    // Traverse through all the children of the mesh and apply the environment map
    // and make sure they can cast and receive shadows
    plane.traverse((object) => {
      if(object instanceof Mesh) {
        object.material.envMap = envMap;
        object.sunEnvIntensity = 1;
        object.moonEnvIntensity = 0.3;
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
    
    // Creates a white trail using the alphamap which makes the /assets/mask.jpg texture
    //opaque making it look like a white smoke trail
    let trail = new Mesh(
        new PlaneGeometry(1, 2),
        new MeshPhysicalMaterial({
          envMap,
          envMapIntensity: 3,
    
          //roughness: 0.4,
          //metalness: 0,
          //transmission: 1,
    
          transparent: true,
          opacity: 1,
          alphaMap: trailTexture,
        })
      );
      trail.sunEnvIntensity = 3;
      trail.moonEnvIntensity = 0.7;
      

      trail.rotateX(Math.PI);
      trail.translateY(1.1);

    let group = new Group();
    group.add(plane);
    group.add(trail);
    scene.add(group);

    //Configure the initial rotation and the pathway of the plane
    return {
        group,
        rot: Math.random() * Math.PI * 2.0,
        rad: Math.random() * Math.PI * 0.45 + 0.2,
        yOff : 10.5 + Math.random() * 1.0,
        randomAxis: new Vector3(nr(), nr(), nr()).normalize(),
        randomAxisRot: Math.random() * Math.PI * 2,

    };

    }

    // return a random number between -1 and 1
    function nr() {

        return Math.random() * 2 - 1;

    }
