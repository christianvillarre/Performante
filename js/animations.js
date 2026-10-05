/* ==========================================================================
   Performante Wraps — Three.js scenes + general (non-GSAP) animation
   Loaded as a module because the Three.js scenes use `import` statements.
   ========================================================================== */

/* Misc page-load behavior */
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  const nav = performance.getEntriesByType("navigation")[0];
  const isReload = nav && nav.type === "reload";

  if (isReload) {
    window.scrollTo(0, 0);
    window.addEventListener("load", () => window.scrollTo(0, 0), { once: true });
  }

/* Three.js — animated terrain background */
import * as THREE from "three";

/* =====================================================
   TERRAIN CONTAINER
===================================================== */

const terrainContainer =
  document.getElementById("terrain3d");

if (terrainContainer) {

  /* =====================================================
     SCENE
  ===================================================== */

  const terrainScene =
    new THREE.Scene();

  /*
    Transparent background so any video, image,
    gradient or color behind the terrain remains visible.
  */
  terrainScene.background =
    null;

  /* =====================================================
     CAMERA
  ===================================================== */

  const terrainCamera =
    new THREE.PerspectiveCamera(
      42,
      Math.max(
        terrainContainer.clientWidth,
        1
      ) /
      Math.max(
        terrainContainer.clientHeight,
        1
      ),
      0.1,
      320
    );

  /*
    Normal resting camera position.
  */
  const cameraStart = {
    x: 0,
    y: 3.2,
    z: 12.5
  };

  /*
    Camera position near the end of the hero scroll.
  */
  const cameraTarget = {
    x: 0,
    y: 1.9,
    z: 4.5
  };

  /*
    Start the camera slightly higher so it can
    gently come down during the intro.
  */
  const cameraIntroHeight =
    1.15;

  terrainCamera.position.set(
    cameraStart.x,
    cameraStart.y +
      cameraIntroHeight,
    cameraStart.z
  );

  terrainCamera.lookAt(
    0,
    -0.05,
    -15
  );

  /* =====================================================
     RENDERER
  ===================================================== */

  const terrainRenderer =
    new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference:
        "high-performance"
    });

  terrainRenderer.setClearColor(
    0x000000,
    0
  );

  terrainRenderer.setPixelRatio(
    Math.min(window.devicePixelRatio || 1, window.matchMedia("(pointer: coarse)").matches ? 1.1 : 1.5)
  );

  terrainRenderer.outputColorSpace =
    THREE.SRGBColorSpace;

  terrainRenderer.toneMapping =
    THREE.ACESFilmicToneMapping;

  /*
    Increase this to brighten the terrain.
  */
  terrainRenderer.toneMappingExposure =
    1.55;

  terrainContainer.appendChild(
    terrainRenderer.domElement
  );

  /* =====================================================
     TERRAIN GEOMETRY
  ===================================================== */

  const terrainWidth =
    150;

  const terrainDepth =
    220;

  const terrainGeometry =
    new THREE.PlaneGeometry(
      terrainWidth,
      terrainDepth,
      170,
      250
    );

  terrainGeometry.rotateX(
    -Math.PI / 2
  );

  /* =====================================================
     TERRAIN BASE POSITIONS
  ===================================================== */

  const terrainBaseY =
    -3.3;

  const terrainBaseZ =
    -40;

  /*
    Terrain begins lower during page-load intro.
  */
  const terrainIntroRise =
    1.05;

  /* =====================================================
     TERRAIN UNIFORMS
  ===================================================== */

  const terrainUniforms = {
    uTime: {
      value: 0
    },

    uNearColor: {
      value:
        new THREE.Color(
          0x858585
        )
    },

    uFarColor: {
      value:
        new THREE.Color(
          0x292929
        )
    },

    uPeakColor: {
      value:
        new THREE.Color(
          0xc0c0c0
        )
    },

    /*
      Final wireframe opacity.
    */
    uWireOpacity: {
      value: 0
    }
  };

  const surfaceUniforms = {
    uTime:
      terrainUniforms.uTime,

    uRockDark: {
      value:
        new THREE.Color(
          0x181818
        )
    },

    uRockMid: {
      value:
        new THREE.Color(
          0x5c5c5c
        )
    },

    uRockLight: {
      value:
        new THREE.Color(
          0xaaaaaa
        )
    },

    /*
      Final terrain surface opacity.
    */
    uSurfaceOpacity: {
      value: 0
    }
  };

  /*
    Final opacity values after the intro finishes.
  */
  const finalWireOpacity =
    0;

  const finalSurfaceOpacity =
    0.58;

  /*
    The terrain begins at this percentage
    of its final opacity.
  */
  const introStartOpacity =
    0.02;

  /* =====================================================
     TERRAIN HEIGHT FUNCTION
  ===================================================== */

  const terrainHeightShader = `
    float hill(
      vec2 point,
      vec2 center,
      vec2 spread,
      float elevation
    ){
      vec2 difference =
        (point - center) /
        spread;

      return
        exp(
          -dot(
            difference,
            difference
          )
        ) *
        elevation;
    }

    float terrainHeight(
      vec2 point
    ){
      float x =
        point.x;

      float z =
        point.y;

      float height =
        0.0;

      /*
        Broad rolling landscape.
      */
      height +=
        sin(
          x * 0.075 +
          z * 0.032
        ) *
        1.25;

      height +=
        cos(
          x * 0.052 -
          z * 0.061
        ) *
        0.92;

      height +=
        sin(
          x * 0.145 +
          z * 0.098
        ) *
        0.4;

      /*
        Wide natural hills.
      */
      height +=
        hill(
          point,
          vec2(
            -34.0,
            -24.0
          ),
          vec2(
            28.0,
            40.0
          ),
          2.4
        );

      height +=
        hill(
          point,
          vec2(
            36.0,
            -30.0
          ),
          vec2(
            30.0,
            44.0
          ),
          2.7
        );

      height +=
        hill(
          point,
          vec2(
            -48.0,
            -78.0
          ),
          vec2(
            36.0,
            54.0
          ),
          3.0
        );

      height +=
        hill(
          point,
          vec2(
            48.0,
            -84.0
          ),
          vec2(
            38.0,
            58.0
          ),
          3.2
        );

      height +=
        hill(
          point,
          vec2(
            -18.0,
            -118.0
          ),
          vec2(
            44.0,
            62.0
          ),
          2.2
        );

      height +=
        hill(
          point,
          vec2(
            25.0,
            -135.0
          ),
          vec2(
            48.0,
            68.0
          ),
          2.4
        );

      /*
        Rocky variation.
      */
      height +=
        abs(
          sin(
            x * 0.11 +
            z * 0.052
          )
        ) *
        0.38;

      height +=
        abs(
          cos(
            x * 0.074 -
            z * 0.094
          )
        ) *
        0.27;

      /*
        Small surface detail.
      */
      height +=
        sin(
          x * 0.29 +
          z * 0.21
        ) *
        0.15;

      height +=
        cos(
          x * 0.47 -
          z * 0.35
        ) *
        0.08;

      /*
        Very subtle terrain motion.
      */
      height +=
        sin(
          z * 0.045 -
          uTime * 0.035 +
          x * 0.022
        ) *
        0.05;

      /*
        Keep center lower behind content.
      */
      float sideStrength =
        smoothstep(
          5.0,
          30.0,
          abs(x)
        );

      height *=
        mix(
          0.58,
          1.0,
          sideStrength
        );

      /*
        Reduce foreground obstruction.
      */
      float foregroundStrength =
        smoothstep(
          2.0,
          38.0,
          -z
        );

      height *=
        mix(
          0.48,
          1.0,
          foregroundStrength
        );

      /*
        Flatten the far horizon.
      */
      float horizonFlatten =
        1.0 -
        smoothstep(
          75.0,
          125.0,
          -z
        );

      height *=
        mix(
          0.34,
          1.0,
          horizonFlatten
        );

      return height;
    }
  `;

  /* =====================================================
     WIREFRAME MATERIAL
  ===================================================== */

  const terrainWireMaterial =
    new THREE.ShaderMaterial({
      uniforms:
        terrainUniforms,

      transparent:
        true,

      depthWrite:
        false,

      side:
        THREE.DoubleSide,

      wireframe:
        true,

      vertexShader: `
        uniform float uTime;

        varying float vHeight;
        varying float vDepth;
        varying vec3 vWorldPosition;

        ${terrainHeightShader}

        void main(){
          vec3 displaced =
            position;

          float height =
            terrainHeight(
              vec2(
                position.x,
                position.z
              )
            );

          displaced.y +=
            height;

          vec4 worldPosition =
            modelMatrix *
            vec4(
              displaced,
              1.0
            );

          vec4 viewPosition =
            viewMatrix *
            worldPosition;

          vHeight =
            height;

          vDepth =
            -viewPosition.z;

          vWorldPosition =
            worldPosition.xyz;

          gl_Position =
            projectionMatrix *
            viewPosition;
        }
      `,

      fragmentShader: `
        uniform vec3 uNearColor;
        uniform vec3 uFarColor;
        uniform vec3 uPeakColor;
        uniform float uWireOpacity;

        varying float vHeight;
        varying float vDepth;
        varying vec3 vWorldPosition;

        void main(){
          float distanceFade =
            smoothstep(
              8.0,
              120.0,
              vDepth
            );

          vec3 color =
            mix(
              uNearColor,
              uFarColor,
              distanceFade
            );

          float peakAmount =
            smoothstep(
              0.7,
              3.5,
              vHeight
            );

          color =
            mix(
              color,
              uPeakColor,
              peakAmount *
              0.38
            );

          float farFade =
            1.0 -
            smoothstep(
              88.0,
              145.0,
              vDepth
            );

          float nearFade =
            smoothstep(
              4.0,
              13.0,
              vDepth
            );

          float sideFade =
            1.0 -
            smoothstep(
              52.0,
              72.0,
              abs(
                vWorldPosition.x
              )
            );

          float alpha =
            uWireOpacity *
            farFade *
            nearFade *
            sideFade;

          if(
            alpha <
            0.01
          ){
            discard;
          }

          gl_FragColor =
            vec4(
              color,
              alpha
            );
        }
      `
    });

  const terrainWire =
    new THREE.Mesh(
      terrainGeometry,
      terrainWireMaterial
    );

  terrainWire.position.set(
    0,
    terrainBaseY -
      terrainIntroRise,
    terrainBaseZ
  );

  terrainWire.visible=finalWireOpacity>0;
  terrainScene.add(
    terrainWire
  );

  /* =====================================================
     ROCK SURFACE MATERIAL
  ===================================================== */

  const terrainSurfaceMaterial =
    new THREE.ShaderMaterial({
      uniforms:
        surfaceUniforms,

      transparent:
        true,

      depthWrite:
        false,

      side:
        THREE.DoubleSide,

      vertexShader: `
        uniform float uTime;

        varying float vHeight;
        varying float vDepth;
        varying vec3 vWorldPosition;
        varying vec3 vTerrainNormal;

        ${terrainHeightShader}

        void main(){
          vec3 displaced =
            position;

          float height =
            terrainHeight(
              vec2(
                position.x,
                position.z
              )
            );

          displaced.y +=
            height;

          float sampleDistance =
            0.42;

          float nextHeightX =
            terrainHeight(
              vec2(
                position.x +
                sampleDistance,
                position.z
              )
            );

          float nextHeightZ =
            terrainHeight(
              vec2(
                position.x,
                position.z +
                sampleDistance
              )
            );

          vec3 tangentX =
            normalize(
              vec3(
                sampleDistance,
                nextHeightX -
                height,
                0.0
              )
            );

          vec3 tangentZ =
            normalize(
              vec3(
                0.0,
                nextHeightZ -
                height,
                sampleDistance
              )
            );

          vec3 terrainNormal =
            normalize(
              cross(
                tangentZ,
                tangentX
              )
            );

          vec4 worldPosition =
            modelMatrix *
            vec4(
              displaced,
              1.0
            );

          vec4 viewPosition =
            viewMatrix *
            worldPosition;

          vHeight =
            height;

          vDepth =
            -viewPosition.z;

          vWorldPosition =
            worldPosition.xyz;

          vTerrainNormal =
            normalize(
              normalMatrix *
              terrainNormal
            );

          gl_Position =
            projectionMatrix *
            viewPosition;
        }
      `,

      fragmentShader: `
        uniform vec3 uRockDark;
        uniform vec3 uRockMid;
        uniform vec3 uRockLight;
        uniform float uSurfaceOpacity;

        varying float vHeight;
        varying float vDepth;
        varying vec3 vWorldPosition;
        varying vec3 vTerrainNormal;

        float hash(
          vec2 point
        ){
          return fract(
            sin(
              dot(
                point,
                vec2(
                  127.1,
                  311.7
                )
              )
            ) *
            43758.5453
          );
        }

        float noise(
          vec2 point
        ){
          vec2 cell =
            floor(
              point
            );

          vec2 local =
            fract(
              point
            );

          local =
            local *
            local *
            (
              3.0 -
              2.0 *
              local
            );

          float a =
            hash(
              cell
            );

          float b =
            hash(
              cell +
              vec2(
                1.0,
                0.0
              )
            );

          float c =
            hash(
              cell +
              vec2(
                0.0,
                1.0
              )
            );

          float d =
            hash(
              cell +
              vec2(
                1.0,
                1.0
              )
            );

          return mix(
            mix(
              a,
              b,
              local.x
            ),
            mix(
              c,
              d,
              local.x
            ),
            local.y
          );
        }

        void main(){
          vec3 normal =
            normalize(
              vTerrainNormal
            );

          vec3 mainLight =
            normalize(
              vec3(
                -0.48,
                0.86,
                0.30
              )
            );

          vec3 secondaryLight =
            normalize(
              vec3(
                0.72,
                0.36,
                0.40
              )
            );

          float diffuse =
            max(
              dot(
                normal,
                mainLight
              ),
              0.0
            );

          float secondary =
            max(
              dot(
                normal,
                secondaryLight
              ),
              0.0
            );

          float broadNoise =
            noise(
              vWorldPosition.xz *
              0.18
            );

          float fineNoise =
            noise(
              vWorldPosition.xz *
              0.85
            );

          float heightAmount =
            smoothstep(
              -1.5,
              5.0,
              vHeight
            );

          vec3 rockColor =
            mix(
              uRockDark,
              uRockMid,
              0.28 +
              diffuse *
              0.88
            );

          rockColor =
            mix(
              rockColor,
              uRockLight,
              heightAmount *
              0.30
            );

          rockColor +=
            secondary *
            0.11;

          rockColor *=
            0.92 +
            broadNoise *
            0.30 +
            fineNoise *
            0.09;

          float farFade =
            1.0 -
            smoothstep(
              88.0,
              145.0,
              vDepth
            );

          float nearFade =
            smoothstep(
              4.0,
              13.0,
              vDepth
            );

          float sideFade =
            1.0 -
            smoothstep(
              52.0,
              72.0,
              abs(
                vWorldPosition.x
              )
            );

          float alpha =
            uSurfaceOpacity *
            farFade *
            nearFade *
            sideFade;

          if(
            alpha <
            0.01
          ){
            discard;
          }

          gl_FragColor =
            vec4(
              rockColor,
              alpha
            );
        }
      `
    });

  const terrainSurface =
    new THREE.Mesh(
      terrainGeometry,
      terrainSurfaceMaterial
    );

  terrainSurface.position.set(
    0,
    terrainBaseY -
      terrainIntroRise -
      0.04,
    terrainBaseZ
  );

  terrainScene.add(
    terrainSurface
  );

  /* =====================================================
     HORIZON GLOW
  ===================================================== */

  const glowGeometry =
    new THREE.PlaneGeometry(
      130,
      28
    );

  const glowMaterial =
    new THREE.ShaderMaterial({
      transparent:
        true,

      depthWrite:
        false,

      uniforms: {
        uGlowColor: {
          value:
            new THREE.Color(
              0x707070
            )
        },

        uGlowOpacity: {
          value:
            0
        }
      },

      vertexShader: `
        varying vec2 vUv;

        void main(){
          vUv =
            uv;

          gl_Position =
            projectionMatrix *
            modelViewMatrix *
            vec4(
              position,
              1.0
            );
        }
      `,

      fragmentShader: `
        varying vec2 vUv;

        uniform vec3 uGlowColor;
        uniform float uGlowOpacity;

        void main(){
          float vertical =
            smoothstep(
              0.0,
              0.48,
              vUv.y
            ) *
            (
              1.0 -
              smoothstep(
                0.48,
                1.0,
                vUv.y
              )
            );

          float horizontal =
            smoothstep(
              0.0,
              0.18,
              vUv.x
            ) *
            (
              1.0 -
              smoothstep(
                0.82,
                1.0,
                vUv.x
              )
            );

          float alpha =
            vertical *
            horizontal *
            uGlowOpacity;

          gl_FragColor =
            vec4(
              uGlowColor,
              alpha
            );
        }
      `
    });

  const horizonGlow =
    new THREE.Mesh(
      glowGeometry,
      glowMaterial
    );

  horizonGlow.position.set(
    0,
    -1.0,
    -88
  );

  terrainScene.add(
    horizonGlow
  );

  /* =====================================================
     POINTER PARALLAX
  ===================================================== */

  let targetTerrainX =
    0;

  let targetTerrainRotation =
    0;

  window.addEventListener(
    "pointermove",
    function(event){
      const normalizedX =
        event.clientX /
        Math.max(
          window.innerWidth,
          1
        ) -
        0.5;

      /*
        Reduce these for less pointer movement.
      */
      targetTerrainX =
        normalizedX *
        -0.55;

      targetTerrainRotation =
        normalizedX *
        0.006;
    }
  );

  /* =====================================================
     SCROLL PROGRESS
  ===================================================== */

  let scrollProgress =
    0;

  function updateScrollProgress(){
    const section =
      terrainContainer.closest(
        ".hero, .terrain-section, .intro-wrap"
      );

    if(
      !section
    ){
      scrollProgress =
        0;

      return;
    }

    const rect =
      section.getBoundingClientRect();

    const scrollDistance =
      Math.max(
        section.offsetHeight -
        window.innerHeight,
        window.innerHeight
      );

    scrollProgress =
      THREE.MathUtils.clamp(
        -rect.top /
        Math.max(
          scrollDistance,
          1
        ),
        0,
        1
      );
  }

  window.addEventListener(
    "scroll",
    updateScrollProgress,
    {
      passive: true
    }
  );

  updateScrollProgress();

  /* =====================================================
     PAGE-LOAD INTRO
  ===================================================== */

  const terrainIntroDuration =
    2.3;

  let introProgress =
    0;

  /*
    Prevent the entrance from beginning before the
    page is ready.
  */
  let introStarted =
    false;

  window.addEventListener(
    "load",
    function(){
      introStarted =
        true;
    }
  );

  /*
    Also allow it to run when script loads after
    the page has already completed loading.
  */
  if(
    document.readyState ===
    "complete"
  ){
    introStarted =
      true;
  }

  /* =====================================================
     ANIMATION
  ===================================================== */

  const terrainClock =
    new THREE.Clock();

  let terrainVisible=true,lastTerrainFrame=0;
  new IntersectionObserver(entries=>{terrainVisible=entries[0].isIntersecting;},
    {rootMargin:'80px'}).observe(terrainContainer);
  function animateTerrain(now=performance.now()){
    requestAnimationFrame(
      animateTerrain
    );

    if(document.hidden || !terrainVisible){terrainClock.getDelta();lastTerrainFrame=0;return;}
    // The slow background needs fewer frames than the interactive logo.
    if(lastTerrainFrame && now-lastTerrainFrame<1000/30-.5)return;
    lastTerrainFrame=now;
    const deltaTime =
      Math.min(
        terrainClock.getDelta(),
        0.05
      );

    const elapsedTime =
      terrainClock.elapsedTime;

    terrainUniforms.uTime.value =
      elapsedTime;

    /* ===================================================
       INTRO PROGRESS
    =================================================== */

    if(
      introStarted
    ){
      introProgress +=
        deltaTime /
        terrainIntroDuration;
    }

    introProgress =
      THREE.MathUtils.clamp(
        introProgress,
        0,
        1
      );

    /*
      Smooth cubic ease-out.
    */
    const introEase =
      1 -
      Math.pow(
        1 -
        introProgress,
        3
      );

    /*
      Terrain fades in while it rises.
    */
    const introOpacity =
      THREE.MathUtils.lerp(
        introStartOpacity,
        1,
        introEase
      );

    terrainUniforms
      .uWireOpacity
      .value =
        finalWireOpacity *
        introOpacity;

    surfaceUniforms
      .uSurfaceOpacity
      .value =
        finalSurfaceOpacity *
        introOpacity;

    glowMaterial
      .uniforms
      .uGlowOpacity
      .value =
        0.22 *
        introOpacity;

    /*
      Terrain starts lower and rises into place.
    */
    const introTerrainOffset =
      THREE.MathUtils.lerp(
        -terrainIntroRise,
        0,
        introEase
      );

    /* ===================================================
       POINTER MOVEMENT
    =================================================== */

    terrainWire.position.x +=
      (
        targetTerrainX -
        terrainWire.position.x
      ) *
      0.018;

    terrainSurface.position.x =
      terrainWire.position.x;

    terrainWire.rotation.y +=
      (
        targetTerrainRotation -
        terrainWire.rotation.y
      ) *
      0.018;

    terrainSurface.rotation.y =
      terrainWire.rotation.y;

    /* ===================================================
       TERRAIN INTRO RISE
    =================================================== */

    const targetWireY =
      terrainBaseY +
      introTerrainOffset;

    const targetSurfaceY =
      terrainBaseY -
      0.04 +
      introTerrainOffset;

    terrainWire.position.y +=
      (
        targetWireY -
        terrainWire.position.y
      ) *
      0.085;

    terrainSurface.position.y +=
      (
        targetSurfaceY -
        terrainSurface.position.y
      ) *
      0.085;

    /* ===================================================
       SCROLL CAMERA
    =================================================== */

    const scrollCameraY =
      THREE.MathUtils.lerp(
        cameraStart.y,
        cameraTarget.y,
        scrollProgress
      );

    const scrollCameraZ =
      THREE.MathUtils.lerp(
        cameraStart.z,
        cameraTarget.z,
        scrollProgress
      );

    /*
      Camera begins higher, then comes downward.
    */
    const introCameraOffsetY =
      THREE.MathUtils.lerp(
        cameraIntroHeight,
        0,
        introEase
      );

    const targetCameraY =
      scrollCameraY +
      introCameraOffsetY;

    terrainCamera.position.y +=
      (
        targetCameraY -
        terrainCamera.position.y
      ) *
      0.06;

    terrainCamera.position.z +=
      (
        scrollCameraZ -
        terrainCamera.position.z
      ) *
      0.06;

    /*
      Camera view begins slightly higher and then
      settles toward the terrain.
    */
    const scrollLookY =
      THREE.MathUtils.lerp(
        -0.6,
        -1.45,
        scrollProgress
      );

    const introLookOffsetY =
      THREE.MathUtils.lerp(
        0.55,
        0,
        introEase
      );

    const lookTargetY =
      scrollLookY +
      introLookOffsetY;

    const lookTargetZ =
      THREE.MathUtils.lerp(
        -15,
        -25,
        scrollProgress
      );

    terrainCamera.lookAt(
      0,
      lookTargetY,
      lookTargetZ
    );

    terrainRenderer.render(
      terrainScene,
      terrainCamera
    );
  }

  animateTerrain();

  /* =====================================================
     RESIZE
  ===================================================== */

  function resizeTerrain(){
    const width =
      Math.max(
        terrainContainer.clientWidth,
        window.innerWidth,
        1
      );

    const height =
      Math.max(
        terrainContainer.clientHeight,
        window.innerHeight,
        1
      );

    terrainCamera.aspect =
      width /
      height;

    terrainCamera
      .updateProjectionMatrix();

    terrainRenderer.setSize(
      width,
      height,
      false
    );

    terrainRenderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, window.matchMedia("(pointer: coarse)").matches ? 1.1 : 1.5)
    );
  }

  window.addEventListener(
    "resize",
    resizeTerrain
  );

  window.addEventListener(
    "load",
    resizeTerrain
  );

  resizeTerrain();
}

/* Three.js — interactive break-apart logo model */
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";



/* =====================================================
   FOREGROUND SYMBOL SCENE
===================================================== */

const symbolContainer =
  document.getElementById("cube3d");

let symbolRenderer = null;
let symbolCamera = null;
let repaintSymbol = null;
const symbolRenderSize = new THREE.Vector2();

// Expand the camera view instead of scaling the model. The old canvas was
// 70vh on desktop or 360px on mobile; preserve its pixels-per-world-unit.
function symbolViewportFov(height){
  const referenceHeight=window.innerWidth<=760 ? Math.min(240,window.innerWidth*.58) : window.innerHeight*(window.matchMedia("(pointer: coarse)").matches ? .46 : .63);
  return THREE.MathUtils.radToDeg(2*Math.atan(
    Math.tan(THREE.MathUtils.degToRad(35)/2)*height/Math.max(referenceHeight,1)
  ));
}

if (symbolContainer) {
  const symbolScene =
    new THREE.Scene();

  symbolCamera =
    new THREE.PerspectiveCamera(
      symbolViewportFov(Math.max(symbolContainer.clientHeight,1)),
      Math.max(symbolContainer.clientWidth,1) /
        Math.max(symbolContainer.clientHeight,1),
      0.1,
      100
    );

  symbolCamera.position.set(
    0,
    0,
    10
  );

  symbolCamera.lookAt(
    0,
    0,
    0
  );

  symbolRenderer =
    new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference:
        "high-performance"
    });

  symbolRenderer.setClearColor(
    0x000000,
    0
  );

  symbolRenderer.setSize(
    symbolContainer.clientWidth,
    symbolContainer.clientHeight
  );

  symbolRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1,window.matchMedia("(pointer: coarse)").matches?1.25:1.5));
  repaintSymbol=()=>symbolRenderer.render(symbolScene,symbolCamera);

  symbolRenderer.outputColorSpace =
    THREE.SRGBColorSpace;

  /* Cinematic highlight rolloff for brighter, high-end studio reflections. */
  symbolRenderer.toneMapping =
    THREE.ACESFilmicToneMapping;

  symbolRenderer.toneMappingExposure =
    1.42;

  RectAreaLightUniformsLib.init();

  symbolContainer.appendChild(
    symbolRenderer.domElement
  );

  /* Neutral base illumination keeps the black logo readable without turning it blue. */
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.05);
  symbolScene.add(ambientLight);

  const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x080808, 1.9);
  symbolScene.add(hemisphereLight);

  /*
    Extremely broad, feathered gradient lights.

    These are intentionally wide, soft and low-intensity so they create
    smooth color transitions across the logo rather than visible circles.
  */
  const whiteLight = new THREE.SpotLight(
    0xf4f6f8,
    34,
    90,
    Math.PI * 0.48,
    1,
    0.72
  );
  whiteLight.position.set(11, 6, 16);
  whiteLight.target.position.set(0, 0, 0);
  symbolScene.add(whiteLight, whiteLight.target);

  const softLight = new THREE.SpotLight(
    0xcbd1d8,
    27,
    90,
    Math.PI * 0.50,
    1,
    0.7
  );
  softLight.position.set(-12, -1, 15);
  softLight.target.position.set(0, 0, 0);
  symbolScene.add(softLight, softLight.target);

  const rimLight = new THREE.SpotLight(
    0xe8ebef,
    22,
    85,
    Math.PI * 0.46,
    1,
    0.72
  );
  rimLight.position.set(4, 10, -10);
  rimLight.target.position.set(0, 0.5, 0);
  symbolScene.add(rimLight, rimLight.target);

  /*
    A muted warm gradient—not a hard red circle.
  */
  const redAccentLight = new THREE.SpotLight(
    0xb84b3d,
    8,
    75,
    Math.PI * 0.48,
    1,
    0.72
  );
  redAccentLight.position.set(-8, -7, 12);
  redAccentLight.target.position.set(0, -0.5, 0);
  symbolScene.add(redAccentLight, redAccentLight.target);

  /* Broad front and edge fills increase overall visibility while preserving gloss. */
  const visibilityLight = new THREE.DirectionalLight(0xffffff, 4.6);
  visibilityLight.position.set(1.2, 2.2, 8.5);
  symbolScene.add(visibilityLight);

  const logoKeyLight = new THREE.DirectionalLight(0xffffff, 3.15);
  logoKeyLight.position.set(-3.5, 4.5, 10);
  symbolScene.add(logoKeyLight);

  const logoSideFill = new THREE.DirectionalLight(0xdedede, 2.35);
  logoSideFill.position.set(6, -2, 5);
  symbolScene.add(logoSideFill);

  const logoLowerFill = new THREE.DirectionalLight(0xbdbdbd, 1.75);
  logoLowerFill.position.set(-2.8, -5.5, 6);
  symbolScene.add(logoLowerFill);

  /*
    Oversized softboxes create long reflections with very gradual edges.

    The panels are much larger, farther away and less intense so their
    rectangular shape is no longer readable on the logo surface.
  */
  const studioKey = new THREE.RectAreaLight(
    0xf5f6f7,
    7.2,
    30,
    12
  );
  studioKey.position.set(-10, 8, 15);
  studioKey.lookAt(0, 0.2, 0);
  symbolScene.add(studioKey);

  const studioSweep = new THREE.RectAreaLight(
    0xc9ced4,
    5.8,
    28,
    11
  );
  studioSweep.position.set(11, 2, 15);
  studioSweep.lookAt(0, 0, 0);
  symbolScene.add(studioSweep);

  const studioTopStrip = new THREE.RectAreaLight(
    0xffffff,
    5.4,
    24,
    3.5
  );
  studioTopStrip.position.set(0, 12, 10);
  studioTopStrip.lookAt(0, 0, 0);
  symbolScene.add(studioTopStrip);

  const studioRedStrip = new THREE.RectAreaLight(
    0xa94438,
    2.1,
    24,
    10
  );
  studioRedStrip.position.set(-9, -8, 14);
  studioRedStrip.lookAt(0, -0.4, 0);
  symbolScene.add(studioRedStrip);

  /* Narrow edge lights add crisp premium highlights around the silhouette. */
  const edgeKeyLeft = new THREE.SpotLight(0xffffff, 34, 52, Math.PI * 0.20, 0.995, 1.28);
  edgeKeyLeft.position.set(-7.5, 3.6, 6.8);
  edgeKeyLeft.target.position.set(-0.5, 0.4, 0);
  symbolScene.add(edgeKeyLeft, edgeKeyLeft.target);

  const edgeKeyRight = new THREE.SpotLight(0xffffff, 31, 52, Math.PI * 0.20, 0.995, 1.28);
  edgeKeyRight.position.set(7.2, -1.8, 6.4);
  edgeKeyRight.target.position.set(0.6, -0.2, 0);
  symbolScene.add(edgeKeyRight, edgeKeyRight.target);

  /* Back-positioned rim lights illuminate only the outside silhouette. */
  const whiteEdgeRim = new THREE.DirectionalLight(0xffffff, 2.2);
  whiteEdgeRim.position.set(-5.5, 4.2, -7.5);
  symbolScene.add(whiteEdgeRim);

  const redEdgeRim = new THREE.DirectionalLight(0xf00303, 1.35);
  redEdgeRim.position.set(5.8, -2.8, -7.0);
  symbolScene.add(redEdgeRim);

  const lowerRedRim = new THREE.SpotLight(0xff1b12, 18, 38, Math.PI * 0.30, 0.99, 1.5);
  lowerRedRim.position.set(-1.8, -6.5, -5.5);
  lowerRedRim.target.position.set(0, -0.4, 0);
  symbolScene.add(lowerRedRim, lowerRedRim.target);

  /* HERO ORBIT — one unfolding sculpture, with surface-matched glass layers. */
  const heroMotion=window.matchMedia('(prefers-reduced-motion: reduce) and (max-width: 760px)');
  const heroFinePointer=window.matchMedia('(hover: hover) and (pointer: fine)');
  const orbitSettings={openRate:0.85,closeRate:1.4,width:1.55,height:.95,depth:.9};
  let model=null,modelSpan=3,openAmount=0,hovered=false,sceneVisible=true;
  let orbitTime=0,lightTime=0,previousSymbolTime=0,automaticRotation=0;
  let scrollOrbitActive=false,scrollOrbitOrigin=0,scrollOrbitSpread=1;
  const orbitMarquee=document.querySelector(".wrap-marquee-pin-group");
  let targetRotationX=0,targetRotationY=0;
  const modelParts=[],glassLayers=[],orbitLines=[];
  let heroWarming=false;
  const pointer={x:0,y:0,seen:false,blocked:false};
  const raycaster=new THREE.Raycaster();
  const pointerNdc=new THREE.Vector2();
  const closedCenter=new THREE.Vector3();
  const scratchPoint=new THREE.Vector3();
  const inverseRoot=new THREE.Matrix4();
  const orbitWorldRotation=new THREE.Quaternion();
  const orbitInverseRotation=new THREE.Quaternion();
  const solidColor=new THREE.Color(0x16191d);
  const shellColor=new THREE.Color(0x101820);
  const smokeAbsorption=new THREE.Color(0x263541);
  const hoverPadding=48; // CSS pixels beyond the assembled icon, not its orbit.

  // Soft reflection strips give transparent layers something to reflect even
  // between light passes. This texture is lighting only, never a background.
  const environmentCanvas=document.createElement('canvas');
  environmentCanvas.width=512;environmentCanvas.height=256;
  const environmentContext=environmentCanvas.getContext('2d');
  if(environmentContext){
    environmentContext.fillStyle='#0a0c12';environmentContext.fillRect(0,0,512,256);
    [[42,22,62,160,'#ffffff'],[210,38,32,195,'#b1cfff'],[350,65,60,138,'#ffd2d3'],[120,12,230,18,'#eeeeff']].forEach(([x,y,w,h,color])=>{
      const gradient=environmentContext.createLinearGradient(x,y,x+w,y);
      gradient.addColorStop(0,'rgba(0,0,0,0)');gradient.addColorStop(.3,color);
      gradient.addColorStop(.7,color);gradient.addColorStop(1,'rgba(0,0,0,0)');
      environmentContext.fillStyle=gradient;environmentContext.fillRect(x,y,w,h);
    });
    const texture=new THREE.CanvasTexture(environmentCanvas);
    texture.mapping=THREE.EquirectangularReflectionMapping;texture.colorSpace=THREE.SRGBColorSpace;
    const generator=new THREE.PMREMGenerator(symbolRenderer);
    const environment=generator.fromEquirectangular(texture);
    symbolScene.environment=environment.texture;
    generator.dispose();texture.dispose();
  }

  // Four hidden emitters orbit independently in the SAME scene as the logo. Their
  // PointLights illuminate every solid piece and physical glass layer.
  const glowCanvas=document.createElement('canvas');glowCanvas.width=64;glowCanvas.height=64;
  const glowContext=glowCanvas.getContext('2d');
  if(glowContext){
    const glow=glowContext.createRadialGradient(32,32,0,32,32,32);
    glow.addColorStop(0,'rgba(255,255,255,1)');glow.addColorStop(.12,'rgba(255,255,255,.65)');
    glow.addColorStop(.35,'rgba(255,255,255,.16)');glow.addColorStop(1,'rgba(255,255,255,0)');
    glowContext.fillStyle=glow;glowContext.fillRect(0,0,64,64);
  }
  const glowTexture=new THREE.CanvasTexture(glowCanvas);
  const lightGeometry=new THREE.SphereGeometry(1,10,8);
  const orbitLights=[0xf1f6ff,0xb5d8ff,0xff6770,0xddc5ff].map((color,index)=>{
    const light=new THREE.PointLight(color,0,0,2);
    const core=new THREE.Mesh(lightGeometry,new THREE.MeshBasicMaterial({color,transparent:true,opacity:.85,depthWrite:false}));
    const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,color,transparent:true,opacity:.35,blending:THREE.AdditiveBlending,depthWrite:false}));
    core.visible=false;glow.visible=false; // Emit light without visible orb markers.
    light.add(core,glow);symbolScene.add(light);
    // A broad moving softbox accompanies each small emitter. Large reflections
    // remain legible on thin panels even when they rotate away from a point light.
    const softbox=new THREE.RectAreaLight(color,5,1,1);
    symbolScene.add(softbox);
    return {light,softbox,core,glow,index};
  });
  function updateOrbitLights(dt){
    if(!heroMotion.matches)lightTime+=dt;
    orbitLights.forEach(({light,softbox,core,glow,index})=>{
      const angle=lightTime*(.17+index*.035)*(index%2?-1:1)+index*Math.PI*.5;
      const radius=modelSpan*.78;
      light.position.set(Math.cos(angle)*radius*1.35,
        Math.sin(angle*.79+index)*radius*.6,
        Math.sin(angle)*radius*.72+.35*modelSpan);
      light.intensity=modelSpan*modelSpan*1.15*(index===2?.72:1);
      light.distance=modelSpan*7;
      panelLightStrength.value[index]=light.intensity/(modelSpan*modelSpan);
      softbox.position.copy(light.position).multiplyScalar(1.12);
      softbox.width=modelSpan*.75;
      softbox.height=modelSpan*.48;
      softbox.intensity=6;
      softbox.lookAt(0,0,0);
      core.scale.setScalar(modelSpan*.009);
      glow.scale.setScalar(modelSpan*.18);
    });
  }

  // Every detached surface gets its own additive reflection pass, attached to
  // that exact mesh. This runs AFTER the physical transmission pass, so glass
  // transparency cannot wash away the reflected highlights. No central-shell
  // material changes and no billboard/sprite substitutes for panel lighting.
  const panelLightStrength={value:new Float32Array(4)};
  function addPanelReflections(mesh,isStrip=false){
    const material=new THREE.ShaderMaterial({
      uniforms:{
        pwLightPositions:{value:orbitLights.map(item=>item.light.position)},
        pwLightColors:{value:orbitLights.map(item=>item.light.color)},
        pwLightStrength:panelLightStrength,
        pwSpan:{value:modelSpan},pwFade:{value:0},pwGain:{value:isStrip?.8:.65}
      },
      vertexShader:`
        varying vec3 pwViewPosition;
        varying vec3 pwNormal;
        void main(){
          vec4 viewPosition=modelViewMatrix*vec4(position,1.0);
          pwViewPosition=viewPosition.xyz;
          pwNormal=normalize(normalMatrix*normal);
          gl_Position=projectionMatrix*viewPosition;
        }
      `,
      fragmentShader:`
        uniform vec3 pwLightPositions[4],pwLightColors[4];
        uniform float pwLightStrength[4],pwSpan,pwFade,pwGain;
        varying vec3 pwViewPosition;
        varying vec3 pwNormal;
        void main(){
          vec3 N=normalize(pwNormal);
          vec3 V=normalize(-pwViewPosition);
          vec3 shine=vec3(0.0);
          float rim=pow(1.0-abs(dot(N,V)),2.0);
          for(int i=0;i<4;i++){
            vec3 lightView=(viewMatrix*vec4(pwLightPositions[i],1.0)).xyz;
            vec3 toLight=lightView-pwViewPosition;
            float distanceToLight=max(length(toLight),0.0001);
            vec3 L=toLight/distanceToLight;
            vec3 halfVector=L+V;
            vec3 H=halfVector/max(length(halfVector),0.0001);
            float aligned=clamp(abs(dot(N,H)),0.0,1.0);
            float falloff=1.0/(1.0+pow(distanceToLight/pwSpan,2.0)*0.45);
            // Broad softbox reflection plus a crisp moving glint on each face.
            float reflection=pow(aligned,10.0)*0.24+pow(aligned,90.0)*2.4;
            reflection+=rim*abs(dot(N,L))*0.06;
            shine+=pwLightColors[i]*pwLightStrength[i]*falloff*reflection;
          }
          // Fade radiance, not coverage: dark glass and transparent holes stay
          // intact while the rotating surfaces catch clearly visible light.
          gl_FragColor=vec4(shine*pwGain,clamp(pwFade,0.0,1.0));
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
      transparent:true,blending:THREE.AdditiveBlending,
      side:THREE.DoubleSide,depthTest:true,depthWrite:false,
      polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2
    });
    const reflection=new THREE.Mesh(mesh.geometry,material);
    reflection.name='Detached surface reflection';
    reflection.renderOrder=20;reflection.raycast=()=>{};
    reflection.onBeforeRender=()=>{
      material.uniforms.pwFade.value=Math.min(1,mesh.material.opacity/(isStrip?.52:.42));
    };
    mesh.add(reflection);
    return reflection;
  }
  function makeOrbit(glass=false,index=0){
    const u=new THREE.Vector3(Math.random()*2-1,Math.random()*1.4-.7,Math.random()-.5).normalize();
    const normal=new THREE.Vector3(Math.random()-.5,Math.random()-.5,1).normalize();
    const v=new THREE.Vector3().crossVectors(normal,u).normalize();
    if(v.lengthSq()<.001)v.set(0,1,0);
    return {u,v,phase:Math.random()*Math.PI*2,speed:(.12+Math.random()*.14)*(index%2?-1:1),
      radius:modelSpan*((glass?.53:.38)+Math.random()*(glass?.21:.16)),
      axis:new THREE.Vector3(Math.random()-.5,Math.random()-.5,Math.random()-.5).normalize(),
      spin:(Math.random()-.5)*(glass?1.2:.55)};
  }
  function randomizeOrbits(){
    glassLayers.forEach((layer,index)=>layer.orbit=makeOrbit(true,index));
    orbitTime=0;
  }
  function orbitPosition(layer,out){
    // Travel on one straight axis from the attachment face, with no upward
    // drift or curved transition into a second flight direction.
    return out.copy(layer.flightOffset).multiplyScalar(scrollOrbitSpread).add(layer.homeRoot);
  }

  function createOrbitLines(){
    for(let index=0;index<3;index++){
      const points=[];
      const radius=modelSpan*(.7+index*.12);
      for(let step=0;step<=96;step++){
        const angle=step/96*Math.PI*1.45;
        points.push(new THREE.Vector3(Math.cos(angle)*radius,Math.sin(angle)*radius*.7,0));
      }
      const geometry=new THREE.BufferGeometry().setFromPoints(points);
      const material=new THREE.LineBasicMaterial({color:0xa4c5df,
        transparent:true,opacity:0,depthWrite:false});
      const line=new THREE.Line(geometry,material);
      line.raycast=()=>{};line.visible=false;
      model.add(line);orbitLines.push(line);
    }
  }
  function updateOrbitLines(amount){
    orbitLines.forEach((line,index)=>{
      line.visible=amount>0 && !heroMotion.matches;
      if(!line.visible)return;
      line.position.copy(closedCenter);
      line.scale.setScalar((.65+.35*amount)*scrollOrbitSpread);
      line.rotation.set(.35+index*.45,.2+index*.6,
        index*2.1+orbitTime*(index%2?-.18:.14));
      line.material.opacity=(.24+index*.035)*amount;
    });
  }

  // Extract connected coplanar islands from the real GLB triangle topology.
  // Original vertices are copied exactly: concave boundaries, cutouts, and
  // narrow faces retain the source logo shape. Nothing is projected to a box.
  function extractLogoFaces(part){
    const relative=new THREE.Matrix4().multiplyMatrices(inverseRoot,part.mesh.matrixWorld);
    const source=part.mesh.geometry.clone().applyMatrix4(relative);
    const position=source.getAttribute('position'),index=source.getIndex();
    if(!position){source.dispose();return [];}
    const count=index?index.count:position.count;
    const first=Math.max(0,source.drawRange.start || 0);
    const last=Math.min(count,first+source.drawRange.count);
    const tolerance=Math.max(modelSpan*1e-6,1e-8);
    const planeTolerance=modelSpan*1e-5;
    const faces=[],edgeMap=new Map(),parent=[];
    const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();
    const ab=new THREE.Vector3(),ac=new THREE.Vector3();
    const key=v=>`${Math.round(v.x/tolerance)},${Math.round(v.y/tolerance)},${Math.round(v.z/tolerance)}`;
    const root=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};
    for(let offset=first;offset+2<last;offset+=3){
      a.fromBufferAttribute(position,index?index.getX(offset):offset);
      b.fromBufferAttribute(position,index?index.getX(offset+1):offset+1);
      c.fromBufferAttribute(position,index?index.getX(offset+2):offset+2);
      ab.subVectors(b,a);ac.subVectors(c,a);
      const normal=new THREE.Vector3().crossVectors(ab,ac);
      const twiceArea=normal.length();if(twiceArea<tolerance*tolerance)continue;
      normal.divideScalar(twiceArea);
      const id=faces.length;parent.push(id);
      faces.push({vertices:[a.clone(),b.clone(),c.clone()],normal,d:normal.dot(a),area:twiceArea*.5});
      const keys=[key(a),key(b),key(c)];
      for(let e=0;e<3;e++){
        const x=keys[e],y=keys[(e+1)%3];const edge=x<y?x+'|'+y:y+'|'+x;
        const neighbors=edgeMap.get(edge)||[];
        for(const neighbor of neighbors){
          const r=root(neighbor),prior=faces[r];
          if(prior.normal.dot(normal)>1-1e-6 && Math.abs(prior.normal.dot(a)-prior.d)<planeTolerance){parent[root(id)]=r;}
        }
        neighbors.push(id);edgeMap.set(edge,neighbors);
      }
    }
    const groups=new Map();
    faces.forEach((face,i)=>{const r=root(i);if(!groups.has(r))groups.set(r,{faces:[],area:0,normal:face.normal});const group=groups.get(r);group.faces.push(face);group.area+=face.area;});
    source.dispose();
    // Every nondegenerate planar island in the Blender mesh gets a panel.
    return [...groups.values()].sort((a,b)=>b.area-a.area).map(group=>({part,group}));
  }
  function makeSurfaceGeometry(group){
    const vertices=[];
    group.faces.forEach(face=>face.vertices.forEach(v=>vertices.push(v.x,v.y,v.z)));
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
    geometry.computeVertexNormals();geometry.computeBoundingBox();
    const homeRoot=geometry.boundingBox.getCenter(new THREE.Vector3());
    geometry.translate(-homeRoot.x,-homeRoot.y,-homeRoot.z);
    return {geometry,homeRoot};
  }
  // Build thin, light-reactive ribbons along the actual surface boundary.
  // A physical mesh material allows the moving lights to create specular sweeps;
  // LineBasicMaterial would leave these lines unaffected by illumination.
  function makeSeamGeometry(surface,normal){
    const boundary=new THREE.EdgesGeometry(surface,10);
    const points=boundary.getAttribute('position');
    const vertices=[],normals=[];
    const width=modelSpan*.0014;
    const a=new THREE.Vector3(),b=new THREE.Vector3(),across=new THREE.Vector3();
    for(let i=0;i+1<points.count;i+=2){
      a.fromBufferAttribute(points,i);b.fromBufferAttribute(points,i+1);
      across.subVectors(b,a).cross(normal).normalize().multiplyScalar(width*.5);
      const corners=[a.clone().sub(across),a.clone().add(across),b.clone().add(across),b.clone().sub(across)];
      for(const k of [0,1,2,0,2,3]){const v=corners[k];vertices.push(v.x,v.y,v.z);normals.push(normal.x,normal.y,normal.z);}
    }
    boundary.dispose();
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
    geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
    return geometry;
  }
  // Blend the original solid finish into the hollow shell as the faces leave.
  // Hover and scroll share the same expansion amount, including their return.
  function updateShellMaterial(amount){
    // Restore the exact reference finish before the final docking movement.
    // The same face meshes and reflections remain present after docking.
    const hollow=THREE.MathUtils.smoothstep(amount,.018,.12);
    modelParts.forEach(part=>{
      const material=part.mesh.material;
      material.color.copy(solidColor).lerp(shellColor,hollow);
      material.opacity=THREE.MathUtils.lerp(1,.42,hollow);
      material.transmission=THREE.MathUtils.lerp(.001,.301,hollow);
      material.attenuationColor.setRGB(1,1,1).lerp(smokeAbsorption,hollow);
      material.attenuationDistance=hollow>0?modelSpan*.18/hollow:Infinity;
      material.thickness=modelSpan*THREE.MathUtils.lerp(.008,.033,hollow);
      // Keep the reference logo's resting render state for the entire cycle.
      // Toggling these when hollow reaches zero changes which faces contribute
      // to the image, producing a lighting pop even with continuous lights.
      material.depthWrite=true;
      material.polygonOffset=false;
    });
  }

  function seamMaterial(){
    return new THREE.MeshPhysicalMaterial({
      color:0x657f99,metalness:.65,roughness:.095,clearcoat:1,clearcoatRoughness:.04,
      envMapIntensity:1.8,transmission:.18,thickness:modelSpan*.002,
      transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false,
      emissive:0x1a2d48,emissiveIntensity:.04
    });
  }

  const loader=new GLTFLoader();
  loader.load('/images/icon6.glb',async gltf=>{
    heroWarming=true;
    // Rotate a centered wrapper, never the GLB's possibly off-center origin.
    // Child geometry receives the centering offset once; the pivot stays at 0.
    const content=gltf.scene;
    content.position.set(0,0,0);content.scale.set(1,1,1);
    content.updateMatrixWorld(true);
    const box=new THREE.Box3().setFromObject(content);
    const center=box.getCenter(new THREE.Vector3());
    content.position.sub(center);
    model=new THREE.Group();model.name='Fixed logo center';model.add(content);
    symbolScene.add(model);model.updateMatrixWorld(true);
    const size=box.getSize(new THREE.Vector3());modelSpan=Math.max(size.x,size.y,size.z,.1);
    // Model-local coordinates keep nested GLB parts and their glass aligned.
    inverseRoot.copy(model.matrixWorld).invert();
    // After centering, world origin is the closed icon center.
    closedCenter.set(0,0,0).applyMatrix4(inverseRoot);
    const originals=[];
    model.traverse(child=>{if(child.isMesh)originals.push(child);});
    originals.forEach((child,index)=>{
      const source=Array.isArray(child.material)?child.material[0]:child.material;
      child.material=new THREE.MeshPhysicalMaterial({
        color:0x16191d,metalness:.32,roughness:.12,clearcoat:1,clearcoatRoughness:.055,
        ior:1.52,specularIntensity:1,envMapIntensity:.8,side:THREE.DoubleSide,
        // Keep transmission enabled so fading to the shell does not recompile
        // the shader during hover. At .001 the resting icon remains solid.
        transparent:true,opacity:1,transmission:.001,thickness:modelSpan*.008,
        // Match the original closed logo throughout hover, scroll and return.
        depthWrite:true,polygonOffset:false,
        emissive:0x08090b,emissiveIntensity:.2,map:source?.map || null
      });
      if(!child.geometry.boundingBox)child.geometry.computeBoundingBox();
      const localCenter=child.geometry.boundingBox.getCenter(new THREE.Vector3());
      const homeRoot=child.localToWorld(localCenter.clone()).applyMatrix4(inverseRoot);
      modelParts.push({mesh:child,localCenter,homeRoot,
        originalPosition:child.position.clone(),originalQuaternion:child.quaternion.clone()});
    });
    updateShellMaterial(0);
    // The source meshes retain their original shape as the central shell.
    // Only these extracted panels and seam frames enter the orbit.
    // A ray from outside must reach a panel before passing through another
    // source face. This keeps recessed exterior details but rejects inner walls.
    const sourceMeshes=modelParts.map(part=>part.mesh);
    const surfaceRaycaster=new THREE.Raycaster();
    const sample=new THREE.Vector3(),radial=new THREE.Vector3();
    const visibilityTolerance=modelSpan*.001;
    function exteriorFace(candidate){
      let visibleArea=0;
      const outward=new THREE.Vector3();
      for(const face of candidate.group.faces){
        sample.copy(face.vertices[0]).add(face.vertices[1]).add(face.vertices[2]).multiplyScalar(1/3);
        radial.copy(sample).sub(closedCenter);
        if(radial.lengthSq()<1e-10)radial.copy(face.normal);
        radial.normalize();
        const worldSample=sample.clone().applyMatrix4(model.matrixWorld);
        const worldRadial=radial.clone().transformDirection(model.matrixWorld);
        surfaceRaycaster.set(worldSample.clone().addScaledVector(worldRadial,modelSpan*4),worldRadial.negate());
        const hit=surfaceRaycaster.intersectObjects(sourceMeshes,false)[0];
        if(hit && hit.point.distanceTo(worldSample)<visibilityTolerance){
          visibleArea+=face.area;
          outward.addScaledVector(radial,face.area);
        }
      }
      if(visibleArea<candidate.group.area*.1)return false;
      candidate.landingNormal=candidate.group.normal.clone();
      if(candidate.landingNormal.dot(outward)<0)candidate.landingNormal.negate();
      return true;
    }
    const perPart=modelParts.map(part=>extractLogoFaces(part).filter(exteriorFace));
    const selected=[];
    const maxRank=Math.max(0,...perPart.map(candidates=>candidates.length));
    for(let rank=0;rank<maxRank;rank++){
      for(const candidates of perPart){
        if(candidates[rank])selected.push(candidates[rank]);
      }
    }
    selected.forEach(({group,landingNormal},index)=>{
      const {geometry,homeRoot}=makeSurfaceGeometry(group);
      const seams=makeSeamGeometry(geometry,group.normal);
      const material=new THREE.MeshPhysicalMaterial({
        color:0x354454,metalness:.2,roughness:.16,transmission:.34,
        thickness:modelSpan*.006,ior:1.48,transparent:true,opacity:0,
        clearcoat:1,clearcoatRoughness:.04,envMapIntensity:1.5,specularIntensity:1,
        iridescence:.14,iridescenceIOR:1.3,iridescenceThicknessRange:[120,260],
        side:THREE.DoubleSide,depthWrite:false,
        // Keep attached faces in front of the coincident source shell.
        polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1
      });
      const mesh=new THREE.Mesh(geometry,material);mesh.position.copy(homeRoot);
      const edgeMaterial=seamMaterial();
      const edges=new THREE.Mesh(seams,edgeMaterial);
      edges.position.copy(group.normal).multiplyScalar(modelSpan*.0002);
      mesh.add(edges);model.add(mesh);
      addPanelReflections(mesh);addPanelReflections(edges,true);
      const outward=homeRoot.clone().sub(closedCenter);
      if(outward.lengthSq()<modelSpan*modelSpan*1e-8)outward.copy(group.normal);
      outward.normalize();
      const tangent=new THREE.Vector3().crossVectors(outward,new THREE.Vector3(0,0,1));
      if(tangent.lengthSq()<1e-8)tangent.crossVectors(outward,new THREE.Vector3(0,1,0));
      tangent.normalize();
      // Fan away from each home position, tangential to its safe exterior plane.
      const lateral=homeRoot.clone().sub(closedCenter);
      lateral.addScaledVector(landingNormal,-lateral.dot(landingNormal));
      if(lateral.lengthSq()<modelSpan*modelSpan*1e-8){
        lateral.copy(tangent);
        if(lateral.lengthSq()<1e-8)lateral.set(1,0,0).cross(landingNormal);
        if(lateral.lengthSq()<1e-8)lateral.set(0,1,0).cross(landingNormal);
      }
      lateral.normalize();
      const flightOffset=landingNormal.clone().multiplyScalar(modelSpan*(.9+(index%3)*.14))
        .addScaledVector(lateral,modelSpan*.65);
      glassLayers.push({mesh,edges,isStrip:false,homeRoot:homeRoot.clone(),outward,tangent,
        landingNormal,flightOffset,landingVertex:new THREE.Vector3(),orbit:makeOrbit(true,index),
        targetPosition:new THREE.Vector3(),targetQuaternion:new THREE.Quaternion()});
      // One filled glass panel and its attached lit outline per source face.
      // Avoid a second overlapping copy competing for the same visual space.
    });
    // Separate crowded destinations along the exterior plane, never inward.
    for(let pass=0;pass<12;pass++)for(let a=0;a<glassLayers.length;a++)for(let b=a+1;b<glassLayers.length;b++){
      const first=glassLayers[a],second=glassLayers[b];
      const delta=first.homeRoot.clone().add(first.flightOffset).sub(second.homeRoot).sub(second.flightOffset);
      const distance=delta.length(),spacing=modelSpan*.52;
      if(distance>=spacing)continue;
      if(distance<1e-8)delta.copy(first.tangent).normalize();else delta.divideScalar(distance);
      const firstShift=delta.clone().addScaledVector(first.landingNormal,-delta.dot(first.landingNormal));
      const secondShift=delta.clone().addScaledVector(second.landingNormal,-delta.dot(second.landingNormal));
      first.flightOffset.addScaledVector(firstShift,(spacing-distance)*.55);
      second.flightOffset.addScaledVector(secondShift,-(spacing-distance)*.55);
    }
    createOrbitLines();
    // Compile and render both glass and reflection materials behind the loader.
    // First hover should not pay for shader compilation / texture upload.
    try{
      updateSymbolLighting(0);
      glassLayers.forEach(layer=>{layer.mesh.visible=true;layer.mesh.material.opacity=.42;layer.edges.material.opacity=.52;});
      if(symbolRenderer.compileAsync)await symbolRenderer.compileAsync(symbolScene,symbolCamera);
      else symbolRenderer.compile(symbolScene,symbolCamera);
      symbolRenderer.render(symbolScene,symbolCamera);
      updateParts(0);
      symbolRenderer.render(symbolScene,symbolCamera);
      window.pwBoot?.heroReady();
    }catch(error){
      updateParts(0);console.error('Hero preparation failed:',error);
      window.pwBoot?.heroReady(error);
    }finally{heroWarming=false;}
  },event=>window.pwBoot?.heroProgress(event.loaded,event.total),error=>{
    console.error('GLB Load Failed:',error);heroWarming=false;window.pwBoot?.heroReady(error);
  });

  function setHovered(value){
    value=value && (window.scrollY || 0)<=2;
    if(value && !hovered && openAmount===0)randomizeOrbits();
    hovered=value;window.performanteLogoHover=value;
  }
  function insideLogoRegion(){
    const rect=symbolContainer.getBoundingClientRect();
    if(pointer.x<rect.left || pointer.x>rect.right || pointer.y<rect.top || pointer.y>rect.bottom)return false;
    let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
    // Project only the assembled source meshes. Detached panels must never
    // enlarge the interaction area or keep a closing animation open.
    for(const {mesh} of modelParts){
      const box=mesh.geometry.boundingBox;
      for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){
        scratchPoint.set(x,y,z).applyMatrix4(mesh.matrixWorld).project(symbolCamera);
        const px=rect.left+(scratchPoint.x*.5+.5)*rect.width;
        const py=rect.top+(-scratchPoint.y*.5+.5)*rect.height;
        minX=Math.min(minX,px);maxX=Math.max(maxX,px);
        minY=Math.min(minY,py);maxY=Math.max(maxY,py);
      }
    }
    const dx=Math.max(minX-pointer.x,0,pointer.x-maxX);
    const dy=Math.max(minY-pointer.y,0,pointer.y-maxY);
    return dx*dx+dy*dy<=hoverPadding*hoverPadding;
  }
  function updateHover(){
    if(!model || (window.scrollY || 0)>2 || !pointer.seen || pointer.blocked || !heroFinePointer.matches || heroMotion.matches){setHovered(false);return;}
    model.updateMatrixWorld(true);symbolCamera.updateMatrixWorld();
    const rect=symbolContainer.getBoundingClientRect();
    if(hovered){
      // Start easing home on the very next frame after leaving the logo zone.
      setHovered(insideLogoRegion());
      return;
    }
    if(pointer.x<rect.left || pointer.x>rect.right || pointer.y<rect.top || pointer.y>rect.bottom){setHovered(false);return;}
    pointerNdc.set((pointer.x-rect.left)/Math.max(rect.width,1)*2-1,-(pointer.y-rect.top)/Math.max(rect.height,1)*2+1);
    raycaster.setFromCamera(pointerNdc,symbolCamera);
    const hits=raycaster.intersectObjects(modelParts.map(part=>part.mesh),false);
    // Re-enter the actual logo to reopen, including while the pieces return.
    setHovered(hits.length>0);
  }
  function resetInteraction(){
    pointer.seen=false;pointer.blocked=false;setHovered(false);
    targetRotationX=0;targetRotationY=0;
  }
  window.addEventListener('pointermove',event=>{
    if(event.pointerType==='touch')return;
    pointer.seen=true;pointer.x=event.clientX;pointer.y=event.clientY;
    pointer.blocked=!!event.target.closest?.('a,button,input,textarea,select,[contenteditable]');
    const rect=symbolContainer.getBoundingClientRect();
    targetRotationY=THREE.MathUtils.clamp((pointer.x-rect.left)/Math.max(rect.width,1)-.5,-.6,.6)*.7;
    targetRotationX=THREE.MathUtils.clamp((pointer.y-rect.top)/Math.max(rect.height,1)-.5,-.6,.6)*.32;
  },{passive:true});
  window.addEventListener('scroll',resetInteraction,{passive:true});
  window.addEventListener('blur',resetInteraction);
  window.addEventListener('pointercancel',resetInteraction);
  document.addEventListener('mouseleave',resetInteraction);
  heroMotion.addEventListener('change',resetInteraction);
  heroFinePointer.addEventListener('change',resetInteraction);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)resetInteraction();});
  new IntersectionObserver(entries=>{
    sceneVisible=entries[0].isIntersecting;
    if(!sceneVisible)resetInteraction();
  },{rootMargin:'80px'}).observe(symbolContainer);

  function scrollOrbitState(){
    const scroll=Math.max(0,window.scrollY || 0);
    const height=Math.max(1,window.innerWidth<=760?symbolContainer.clientHeight:window.innerHeight);
    if(scroll<=2 || !orbitMarquee)return {active:false,progress:0,growth:0,returning:0};
    // The marquee is pinned later in its own transition. Its trigger's start
    // preserves the original document position even while its DOM is pinned.
    const trigger=window.ScrollTrigger?.getAll?.().find(item=>item.trigger===orbitMarquee);
    const marqueeTop=trigger?trigger.start+height*.3:orbitMarquee.getBoundingClientRect().top+scroll;
    // Fit the entire sequence to the existing hero/About layout, with no added
    // space. Reassembly finishes just inside the existing transition.
    const transitionStart=trigger?trigger.start:marqueeTop-height*.3;
    const finish=Math.max(height*.65,transitionStart+height*.25);
    const progress=THREE.MathUtils.clamp(scroll/finish,0,1);
    return {active:true,progress,
      // Open for 40%, linger fully open until 58%, then return for 42%.
      // updateParts already smoothsteps the geometry interpolation; do not
      // smoothstep twice and concentrate the movement into a short middle burst.
      growth:THREE.MathUtils.clamp(progress/.40,0,1),
      returning:THREE.MathUtils.clamp((progress-.58)/.42,0,1)};
  }

  function updateParts(dt){
    if(!model)return;
    const scrollState=scrollOrbitState();
    if(scrollState.active && !heroMotion.matches){
      if(!scrollOrbitActive){
        scrollOrbitOrigin=openAmount;
        if(openAmount===0)randomizeOrbits();
      }
      scrollOrbitActive=true;
      // Capture the current hover opening once, so starting to scroll while
      // hovering cannot snap the pieces closed. Thereafter scroll owns spread.
      openAmount=THREE.MathUtils.lerp(scrollOrbitOrigin,1,scrollState.growth)*(1-scrollState.returning);
      scrollOrbitSpread=1+.22*scrollState.growth*(1-scrollState.returning);
    }else{
      scrollOrbitActive=false;scrollOrbitSpread=1;
      const target=hovered && !heroMotion.matches?1:0;
      const rate=target?orbitSettings.openRate:orbitSettings.closeRate;
      openAmount+=(target-openAmount)*(1-Math.exp(-dt*rate));
      if(!target && openAmount<.001)openAmount=0;
      if(heroMotion.matches)openAmount=0;
    }
    if(openAmount>.001 && !heroMotion.matches)orbitTime+=dt*openAmount;
    const amount=openAmount*openAmount*(3-2*openAmount);
    updateShellMaterial(amount);
    updateOrbitLines(amount);
    model.updateMatrixWorld(true);
    model.getWorldQuaternion(orbitWorldRotation);
    orbitInverseRotation.copy(orbitWorldRotation).invert();
    // The hollow shell stays assembled; its actual flat faces orbit and return.
    glassLayers.forEach((layer,index)=>{
      layer.mesh.visible=true;
      // At zero spread these exact faces stay attached, with the same lighting.
      orbitPosition(layer,layer.targetPosition);
      const flight=THREE.MathUtils.smoothstep(amount,.18,.65);
      // Follow the same straight path out and back; align before docking.
      layer.targetPosition.sub(layer.homeRoot).multiplyScalar(amount);
      layer.mesh.position.copy(layer.targetPosition);
      // Keep the floating tilt bounded. Accumulated full turns would unwind
      // rapidly as the docking envelope shrinks, causing visible flips.
      const floatingTilt=layer.orbit.spin*.55+
        Math.sin(orbitTime*layer.orbit.speed*.55+layer.orbit.phase)*.32;
      const spin=floatingTilt*amount*flight;
      layer.targetQuaternion.setFromAxisAngle(layer.orbit.axis,spin);
      layer.mesh.quaternion.copy(layer.targetQuaternion);
      // Keep every rotating corner outside its attachment plane. Use actual
      // vertices so narrow and irregular panels receive only needed clearance.
      const vertices=layer.mesh.geometry.getAttribute('position');
      let clearance=0;
      for(let vertex=0;vertex<vertices.count;vertex++){
        layer.landingVertex.fromBufferAttribute(vertices,vertex);
        const homeDepth=layer.landingVertex.dot(layer.landingNormal);
        layer.landingVertex.applyQuaternion(layer.targetQuaternion);
        clearance=Math.max(clearance,homeDepth-layer.landingVertex.dot(layer.landingNormal));
      }
      const approachDepth=layer.mesh.position.dot(layer.landingNormal);
      layer.mesh.position.addScaledVector(layer.landingNormal,Math.max(0,clearance-approachDepth))
        .add(layer.homeRoot);
      // Keep the same finish and reflection pass in flight and at rest.
      // Docking changes only the transform, never visibility or material.
      // Slightly denser at full spread; preserve the established docked finish.
      const spreadOpacity=THREE.MathUtils.smoothstep(amount,.35,.9);
      layer.mesh.material.opacity=THREE.MathUtils.lerp(layer.isStrip?.58:.48,layer.isStrip?.68:.60,spreadOpacity);
      if(layer.edges)layer.edges.material.opacity=THREE.MathUtils.lerp(.58,.68,spreadOpacity);
    });
  }

  // Lighting has its own uninterrupted clock and fixed power/path settings.
  // Hover, panel orbit time and reassembly never retune or reset this rig.
  function updateSymbolLighting(dt){
    updateOrbitLights(dt);
    whiteLight.position.x = 11 + Math.cos(lightTime * 0.09) * 7.5;
    whiteLight.position.y = 6 + Math.sin(lightTime * 0.075) * 3.2;
    whiteLight.position.z = 16 + Math.sin(lightTime * 0.065) * 2.0;
    whiteLight.target.position.x = Math.sin(lightTime * 0.055) * 1.0;
    whiteLight.target.position.y = Math.cos(lightTime * 0.05) * 0.5;
    whiteLight.intensity = 32 + Math.sin(lightTime * 0.12) * 3.5;

    softLight.position.x = -12 + Math.cos(lightTime * 0.075 + Math.PI) * 7.0;
    softLight.position.y = -1 + Math.cos(lightTime * 0.06) * 3.0;
    softLight.position.z = 15 + Math.sin(lightTime * 0.07 + Math.PI) * 1.8;
    softLight.target.position.x = Math.cos(lightTime * 0.045) * 0.8;
    softLight.target.position.y = Math.sin(lightTime * 0.055) * 0.6;
    softLight.intensity = 25 + Math.sin(lightTime * 0.105 + 1.5) * 2.8;

    rimLight.position.x = 4 + Math.sin(lightTime * 0.06) * 4.5;
    rimLight.position.y = 10 + Math.cos(lightTime * 0.07) * 3.2;
    rimLight.intensity = 20 + Math.sin(lightTime * 0.11) * 2.4;

    redAccentLight.position.x = -8 + Math.sin(lightTime * 0.065) * 4.0;
    redAccentLight.position.y = -7 + Math.cos(lightTime * 0.06) * 2.6;
    redAccentLight.intensity =
      6.5 +
      Math.max(
        0,
        Math.sin(lightTime * 0.09 - 1.1)
      ) * 3.0;

    visibilityLight.intensity = 3.8 + Math.sin(lightTime * 0.24) * 0.34;
    logoKeyLight.intensity = 3.45 + Math.sin(lightTime * 0.19 + 0.7) * 0.26;
    logoSideFill.intensity = 2.65 + Math.sin(lightTime * 0.16 + 1.1) * 0.18;
    logoLowerFill.intensity = 1.55 + Math.sin(lightTime * 0.21 + 2.0) * 0.16;

    /*
      Very slow oversized softbox drift creates broad gradient bands.
      Their dimensions and distance keep the panel edges out of view.
    */
    studioKey.position.x = -10 + Math.sin(lightTime * 0.055) * 5.0;
    studioKey.position.y = 8 + Math.cos(lightTime * 0.045) * 2.0;
    studioKey.position.z = 15 + Math.sin(lightTime * 0.04) * 1.2;
    studioKey.intensity = 7.0 + Math.sin(lightTime * 0.085) * 0.75;
    studioKey.lookAt(0, 0.15, 0);

    studioSweep.position.x = 11 + Math.cos(lightTime * 0.05) * 5.5;
    studioSweep.position.y = 2 + Math.sin(lightTime * 0.06) * 2.8;
    studioSweep.position.z = 15 + Math.cos(lightTime * 0.04) * 1.1;
    studioSweep.intensity = 5.6 + Math.sin(lightTime * 0.075 + 1.4) * 0.65;
    studioSweep.lookAt(0, 0, 0);

    studioTopStrip.position.x = Math.sin(lightTime * 0.04) * 5.0;
    studioTopStrip.position.y = 12 + Math.cos(lightTime * 0.045) * 1.3;
    studioTopStrip.position.z = 10 + Math.cos(lightTime * 0.05) * 1.5;
    studioTopStrip.intensity = 5.2 + Math.sin(lightTime * 0.07 + 0.5) * 0.6;
    studioTopStrip.lookAt(0, 0.1, 0);

    studioRedStrip.position.x = -9 + Math.sin(lightTime * 0.05 + 1.7) * 5.0;
    studioRedStrip.position.y = -8 + Math.cos(lightTime * 0.045) * 1.8;
    studioRedStrip.intensity =
      1.7 +
      Math.max(
        0,
        Math.sin(lightTime * 0.07 - 0.7)
      ) * 0.8;
    studioRedStrip.lookAt(0, -0.35, 0);

    edgeKeyLeft.position.y = 3.6 + Math.sin(lightTime * 0.19) * 1.5;
    edgeKeyLeft.intensity = 46 + Math.sin(lightTime * 0.33) * 5;

    edgeKeyRight.position.y = -1.8 + Math.cos(lightTime * 0.21) * 1.7;
    edgeKeyRight.intensity = 42 + Math.sin(lightTime * 0.29 + 1.2) * 5;

    whiteEdgeRim.position.x = -5.5 + Math.sin(lightTime * 0.16) * 2.2;
    whiteEdgeRim.position.y = 4.2 + Math.cos(lightTime * 0.18) * 1.2;
    whiteEdgeRim.intensity = 2.2;

    redEdgeRim.position.x = 5.8 + Math.cos(lightTime * 0.15) * 2.0;
    redEdgeRim.position.y = -2.8 + Math.sin(lightTime * 0.17) * 1.3;
    redEdgeRim.intensity = 1.35;

    lowerRedRim.position.x = -1.8 + Math.sin(lightTime * 0.22) * 2.4;
    lowerRedRim.intensity = 18;

  }

  const symbolClock=new THREE.Clock();
  let lastSymbolFrame=0;
  function animateSymbol(now=performance.now()){
    requestAnimationFrame(animateSymbol);
    // Avoid rendering the expensive glass scene at 120/144/240 Hz.
    if(lastSymbolFrame && now-lastSymbolFrame<1000/60-2)return;
    lastSymbolFrame=now;
    const symbolTime=symbolClock.getElapsedTime();
    const dt=Math.min(Math.max(symbolTime-previousSymbolTime,0),.04);
    previousSymbolTime=symbolTime;
    if(document.hidden || !sceneVisible || heroWarming || (window.pwBoot && !window.pwBoot.released))return;
    updateHover(performance.now());
    if(!heroMotion.matches)automaticRotation+=dt*.096*(1-openAmount*.8);
    updateSymbolLighting(dt);

    if(model){
      if(!heroMotion.matches){
        model.rotation.x+=(targetRotationX*.6+Math.sin(symbolTime*.38)*.05-model.rotation.x)*(1-Math.exp(-dt*2.1));
        model.rotation.y+=(automaticRotation+targetRotationY*.6-model.rotation.y)*(1-Math.exp(-dt*2.7));
        model.rotation.z=Math.sin(symbolTime*.24)*.025;
      }
      updateParts(dt);
    }
    symbolRenderer.render(symbolScene,symbolCamera);
  }
  animateSymbol();
}

/* =====================================================
   RESIZE BOTH SCENES
===================================================== */

function resizeScenes(){
  if(
    terrainContainer &&
    terrainRenderer &&
    terrainCamera
  ){
    const width =
      Math.max(
        terrainContainer.clientWidth,
        1
      );

    const height =
      Math.max(
        terrainContainer.clientHeight,
        1
      );

    terrainCamera.aspect =
      width / height;

    terrainCamera
      .updateProjectionMatrix();

    terrainRenderer.setSize(
      width,
      height,
      false
    );
  }

  if(
    symbolContainer &&
    symbolRenderer &&
    symbolCamera
  ){
    const width =
      Math.max(
        symbolContainer.clientWidth,
        1
      );

    const height =
      Math.max(
        symbolContainer.clientHeight,
        1
      );

    symbolRenderer.getSize(symbolRenderSize);
    // Mobile toolbar events fire resize even when the stable canvas is unchanged.
    if(symbolRenderSize.x===width && symbolRenderSize.y===height)return;
    symbolCamera.aspect =
      width / height;
    symbolCamera.fov = symbolViewportFov(height);

    symbolCamera
      .updateProjectionMatrix();

    symbolRenderer.setSize(
      width,
      height,
      false
    );
    // A real resize clears WebGL; repaint before the browser can show a blank frame.
    repaintSymbol?.();
  }
}

window.addEventListener(
  "resize",
  resizeScenes
);

window.addEventListener(
  "load",
  resizeScenes
);

resizeScenes();
// Dynamic viewport height and layout changes can resize the full-screen stage
// without a conventional window resize (for example mobile browser chrome).
if(symbolContainer && typeof ResizeObserver!=='undefined'){
  const symbolViewportObserver=new ResizeObserver(resizeScenes);
  symbolViewportObserver.observe(symbolContainer);
}

/* Before/after filmstrip carousel */
    (function(){
      var root = document.getElementById('pwFilmstrip');
      if(!root) return;

      var viewport = root.querySelector('.wrap-filmstrip__viewport');
      var track   = root.querySelector('.wrap-filmstrip__track');
      var items   = Array.prototype.slice.call(root.querySelectorAll('.wrap-filmstrip__item'));
      var prevBtn = root.querySelector('.wrap-filmstrip__arrow--prev');
      var nextBtn = root.querySelector('.wrap-filmstrip__arrow--next');

      var n = 7;              // number of unique images
      var index = n;          // start in the middle copy so there's room to move either direction
      var busy = false;

      function step(){
        // distance from one item's left edge to the next item's left edge, incl. gap
        var a = items[0].getBoundingClientRect();
        var b = items[1].getBoundingClientRect();
        return b.left - a.left;
      }

      function apply(i, animate){
        track.style.transition = animate ? 'transform .5s cubic-bezier(.2,.7,.2,1)' : 'none';
        track.style.transform = 'translateX(-' + (i * step()) + 'px)';
      }

      function afterMove(){
        // if we've drifted into the outer copy, silently snap back one full set (identical images)
        if(index >= n * 2){
          index -= n;
          requestAnimationFrame(function(){ apply(index, false); });
        } else if(index < n){
          index += n;
          requestAnimationFrame(function(){ apply(index, false); });
        }
        busy = false;
      }

      function go(dir){
        if(busy) return;
        busy = true;
        index += dir;
        apply(index, true);
        track.addEventListener('transitionend', afterMove, {once:true});
      }

      nextBtn.addEventListener('click', function(){ go(1); });
      prevBtn.addEventListener('click', function(){ go(-1); });

      // wheel / trackpad scroll steps through one image at a time
      var wheelAccum = 0;
      var WHEEL_THRESHOLD = 40;

      viewport.addEventListener('wheel', function(e){
        e.preventDefault();
        if(busy) return;
        var delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
        wheelAccum += delta;
        if(wheelAccum > WHEEL_THRESHOLD){
          wheelAccum = 0;
          go(1);
        } else if(wheelAccum < -WHEEL_THRESHOLD){
          wheelAccum = 0;
          go(-1);
        }
      }, {passive:false});

      // --- Drag / swipe support -------------------------------------
      // Shares the same index/apply/go state as the buttons and wheel
      // above, so a drag resolves to a normal whole-item step and the
      // silent infinite-loop snap-back in afterMove() still applies.
      var dragging = false;
      var dragStartX = 0;
      var dragDeltaX = 0;
      var dragIndexAtStart = 0;

      function dragBaseX(){
        return -(dragIndexAtStart * step());
      }

      function pointerDown(clientX){
        if(busy) return;
        dragging = true;
        dragStartX = clientX;
        dragDeltaX = 0;
        dragIndexAtStart = index;
        window.__filmstripDragMoved = false;
        track.style.transition = 'none';
        viewport.classList.add('is-dragging');
      }

      function pointerMove(clientX){
        if(!dragging) return;
        dragDeltaX = clientX - dragStartX;
        if(Math.abs(dragDeltaX) > 6) window.__filmstripDragMoved = true;
        track.style.transform = 'translateX(' + (dragBaseX() + dragDeltaX) + 'px)';
      }

      function pointerUp(){
        if(!dragging) return;
        dragging = false;
        viewport.classList.remove('is-dragging');

        var threshold = step() * 0.18;
        if(dragDeltaX <= -threshold){
          go(1);
        } else if(dragDeltaX >= threshold){
          go(-1);
        } else {
          apply(index, true);
        }
        dragDeltaX = 0;
      }

      viewport.addEventListener('dragstart', function(e){ e.preventDefault(); });
      items.forEach(function(item){
        var img = item.querySelector('img');
        if(img) img.addEventListener('dragstart', function(e){ e.preventDefault(); });
      });

      viewport.addEventListener('mousedown', function(e){
        pointerDown(e.clientX);
        e.preventDefault();
      });
      window.addEventListener('mousemove', function(e){
        if(dragging){ pointerMove(e.clientX); e.preventDefault(); }
      });
      window.addEventListener('mouseup', pointerUp);

      viewport.addEventListener('touchstart', function(e){
        pointerDown(e.touches[0].clientX);
      }, {passive:true});
      viewport.addEventListener('touchmove', function(e){
        if(dragging) pointerMove(e.touches[0].clientX);
      }, {passive:true});
      viewport.addEventListener('touchend', pointerUp);
      viewport.addEventListener('touchcancel', pointerUp);

      // keep the track aligned to the correct position any time its real
      // size changes (webfont load, entrance animations, orientation, etc.)
      // — this is what was causing the first click to "jump": the position
      // was set once before layout had settled, then reset it snapped forward.
      if(window.ResizeObserver){
        var ro = new ResizeObserver(function(){
          if(!busy){ apply(index, false); }
        });
        ro.observe(viewport);
      }

      window.addEventListener('load', function(){ apply(index, false); });
      window.addEventListener('resize', function(){ apply(index, false); });

      apply(index, false);
    })();

/* Hero canvas energy-field lines */
(() => {
  const canvas = document.getElementById("energyField");
  const hero = document.querySelector(".hero");
  if (!canvas || !hero) return;

  const ctx = canvas.getContext("2d");
  if(!ctx)return;
  const lineMotion=window.matchMedia('(prefers-reduced-motion: reduce) and (max-width: 760px)');
  let lineVisible=true;
  let previousLineTime=0;
  let lineFrame=0;
  const lineObserver=new IntersectionObserver(entries=>{
    lineVisible=entries[0].isIntersecting;
    syncLineFrame();
  });
  lineObserver.observe(hero);
  const state = {
    pulses: [],
    impulse: 0,
    impulseTarget: 0,
    lastMove: 0,
    width: 0,
    height: 0,
    dpr: 1,
    time: 0,
    pointerX: 0,
    pointerY: 0,
    targetNX: 0,
    targetNY: 0,
    currentNX: 0,
    currentNY: 0,
    hovering: false,
    touchingLine: false,
    touchedLine: null,
    touchedProgress: 0,
    nextArcAt: 0,
    arcBursts: [],
    previousTouchedLineIndex: null,
    lightningLine: null,
    lightningProgress: 0.5,
    lightningAnchor: null,
    lightningUntil: 0
  };

  const mobile = () => window.innerWidth <= 760;

  /*
    Three single, continuous diagonal curves.
    Each begins at the lower-left and exits at the upper-right.
    Their start/end spacing stays modest, while the different bow and crossover
    values make them weave across one another at different points.
  */
const lines = [
  {
    index: 0,
    orbitPhase: 0,
    startOffset: -1.02,
    endOffset: 1.12,
    bow: -0.108,
    crossCenter: 0.41,
    crossStrength: 0.075,
    phase: 0.25,
    speed: 0.28,
    amplitude: 10,
    shineOffset: 0.10,
    shineSpeed: 0.18
  },
  {
    index: 1,
    orbitPhase: Math.PI * 2 / 3,
    startOffset: 0.00,
    endOffset: 0.00,
    bow: 0.065,
    crossCenter: 0.55,
    crossStrength: -0.060,
    phase: 2.25,
    speed: 0.65,
    amplitude: 12,
    shineOffset: 0.53,
    shineSpeed: 0.21
  },
  {
    index: 2,
    orbitPhase: Math.PI * 4 / 3,
    startOffset: 1.08,
    endOffset: -1.02,
    bow: 0.128,
    crossCenter: 0.69,
    crossStrength: 0.075,
    phase: 4.10,
    speed: 0.27,
    amplitude: 11,
    shineOffset: 0.82,
    shineSpeed: 0.19
  }
];

  function canvasPoint(clientX,clientY){
    const rect=canvas.getBoundingClientRect();
    return {x:(clientX-rect.left)*state.width/Math.max(rect.width,1),
      y:(clientY-rect.top)*state.height/Math.max(rect.height,1)};
  }
  function resize(){
    const width=Math.max(1,canvas.clientWidth),height=Math.max(1,canvas.clientHeight);
    const dpr=Math.min(window.devicePixelRatio || 1,mobile()?1.25:1.5);
    if(width===state.width && height===state.height && dpr===state.dpr)return;
    state.width=width;state.height=height;
    state.dpr = dpr;
    canvas.width = Math.round(state.width * state.dpr);
    canvas.height = Math.round(state.height * state.dpr);
    // CSS owns the canvas size; its backing buffer follows the actual layout.
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    state.arcBursts=[];state.pulses=[];state.lightningLine=null;
    state.lightningAnchor=null;state.lightningUntil=0;state.previousTouchedLineIndex=null;
    syncLineFrame();
  }

  function pointOnCurve(line, progress, time){
    const nx = state.currentNX;
    const ny = state.currentNY;
    const t = progress;
    const mt = 1 - t;

    const endpointGap = mobile()
      ? state.height * 0.075
      : state.height * 0.105;

    const drift =
      Math.sin(time * line.speed + line.phase) *
      line.amplitude;

    /* Subtle movement only, so every path still reads as one clean long curve. */
    const pointerX = nx * state.width * 0.022;
    const pointerY = ny * state.height * 0.026;

    const startX = -state.width * 0.16 + pointerX * 0.12;
    const startY =
      state.height * 0.91 +
      line.startOffset * endpointGap +
      pointerY * 0.16;

    const endX = state.width * 1.16 + pointerX;
    const endY =
      state.height * 0.09 +
      line.endOffset * endpointGap -
      pointerY * 0.24;

    /* Both handles continue in the same diagonal direction for one long arc. */
    const cp1x = state.width * (0.27 + nx * 0.020);
    const cp2x = state.width * (0.73 + nx * 0.018);

    const diagonalAtCp1 = startY + (endY - startY) * 0.27;
    const diagonalAtCp2 = startY + (endY - startY) * 0.73;

    const bowAmount = line.bow * state.height;

    const cp1y =
      diagonalAtCp1 +
      bowAmount +
      drift +
      pointerY * 0.42;

    const cp2y =
      diagonalAtCp2 -
      bowAmount * 0.72 -
      drift * 0.62 -
      pointerY * 0.34;

    const curveX =
      mt * mt * mt * startX +
      3 * mt * mt * t * cp1x +
      3 * mt * t * t * cp2x +
      t * t * t * endX;

    const curveY =
      mt * mt * mt * startY +
      3 * mt * mt * t * cp1y +
      3 * mt * t * t * cp2y +
      t * t * t * endY;

    /*
      A broad, smooth crossover influence. Each line uses a different center,
      so the crossings happen at staggered positions rather than one bundle.
      It fades completely before either endpoint.
    */
    const distanceFromCross = (t - line.crossCenter) / 0.24;
    const crossoverEnvelope = Math.exp(-distanceFromCross * distanceFromCross);
    const endpointFade = Math.pow(Math.sin(Math.PI * t), 1.25);
    const crossover =
      line.crossStrength *
      state.height *
      crossoverEnvelope *
      endpointFade;

    /*
      Slow intertwined rotation. Each line travels around the same invisible
      center path with a 120-degree phase difference. The envelope keeps the
      endpoints stable while the middle appears to twist in three dimensions.
    */
    const orbitSpeed = 0.22;
    const orbitAngle =
      time * orbitSpeed +
      line.orbitPhase +
      t * Math.PI * 1.45;

    const orbitEnvelope =
      Math.pow(Math.sin(Math.PI * t), 0.82);

    const orbitRadius =
      (mobile() ? state.height * 0.020 : state.height * 0.028) *
      orbitEnvelope;

    const orbitX =
      Math.cos(orbitAngle) *
      orbitRadius * 0.58;

    const orbitY =
      Math.sin(orbitAngle) *
      orbitRadius;

    // A light traveling ripple follows pointer energy while endpoints stay anchored.
    const ripple = Math.sin(t*15-time*1.65+line.phase) *
      Math.sin(t*6+time*.55+line.orbitPhase) * endpointFade *
      (mobile()?2.2:3.8) * (0.25+state.impulse*.75);
    const inertia = state.impulse * Math.sin(t*Math.PI) *
      Math.sin(time*.7+line.phase) * (mobile()?2:5);
    return {
      x: curveX + orbitX + inertia*.35,
      y: curveY + crossover + orbitY + ripple + inertia,
      depth: Math.cos(orbitAngle)
    };
  }

  function drawLine(line, time){
    ctx.beginPath();
    for(let i = 0; i <= 100; i++){
      const p = pointOnCurve(line, i / 100, time);
      if(i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    const midDepth = pointOnCurve(line, 0.5, time).depth || 0;
    const depthBrightness = 0.16 + (midDepth + 1) * 0.075;
    const depthWidth = 0.90 + (midDepth + 1) * 0.10;

    ctx.strokeStyle = `rgba(222,238,249,${depthBrightness})`;
    ctx.lineWidth = (mobile() ? 0.75 : 1.1) * depthWidth;
    ctx.shadowBlur = 5 + Math.max(0, midDepth) * 3;
    ctx.shadowColor = "rgba(160,213,250,.34)";
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  function drawShine(line, time){
    const progress = (time * line.shineSpeed + line.shineOffset) % 1;
    const trail = mobile() ? 0.035 : 0.052;
    ctx.lineCap = "round";
    for(let i = 0; i < 12; i++){
      const local = progress - trail + trail * i / 11;
      if(local < 0 || local > 1) continue;
      const a = pointOnCurve(line, local, time);
      const b = pointOnCurve(line, Math.min(1, local + 0.0045), time);
      const weight = 1 - Math.abs(i / 11 * 2 - 1);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = `rgba(237,249,255,${0.08 + weight * 0.48})`;
      ctx.lineWidth = mobile() ? 0.85 : 1.2;
      ctx.shadowBlur = weight * 5;
      ctx.shadowColor = "rgba(190,230,255,.65)";
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  }

  function nearestPoint(line){
    let best = null;
    for(let i = 0; i <= 120; i++){
      const progress = i / 120;
      const point = pointOnCurve(line, progress, state.time);
      const distance = Math.hypot(point.x - state.pointerX, point.y - state.pointerY);
      if(!best || distance < best.distance) best = { point, progress, distance };
    }
    return best;
  }

  function updateTouchState(){
    if(!state.hovering){
      state.touchingLine = false;
      state.touchedLine = null;
      return;
    }
    const nearest = lines
      .map(line => ({ line, ...nearestPoint(line) }))
      .sort((a, b) => a.distance - b.distance)[0];
    const hitRadius = mobile() ? 18 : 13;
    state.touchingLine = nearest.distance <= hitRadius;
    state.touchedLine = state.touchingLine ? nearest.line : null;
    state.touchedProgress = nearest.progress;
  }

  /*
    Start one short lightning sequence when the pointer enters a line.
    It will not restart until the pointer leaves that line or crosses onto another.
  */
  function startLightningSequence(line, progress, now){
    state.lightningLine = line;
    state.lightningProgress = Math.max(0.06, Math.min(0.94, progress));
    state.lightningAnchor = pointOnCurve(line, state.lightningProgress, state.time);
    state.lightningUntil = now + 540;
    if(!lineMotion.matches){
      state.pulses.push({line,progress:state.lightningProgress,born:now,strength:.75});
      state.pulses=state.pulses.slice(-9);
    }
    state.nextArcAt = now;
  }

 function createArcBurst(now){
    if(!state.lightningLine || now >= state.lightningUntil) return;

    const sourceIndex = state.lightningLine.index;
    const progress = state.lightningProgress;
    const targets = lines.filter(line => line.index !== sourceIndex);

    targets.forEach((target, i) => {
      // Store curve locations, so both connections follow the actual lines.
      const targetJitter = (Math.random() - 0.5) * 0.003;

      state.arcBursts.push({
        sourceLine:state.lightningLine,targetLine:target,
        sourceProgress:progress,targetProgress:Math.max(0.03,Math.min(0.97,progress+targetJitter)),
        start: {
          x: pointOnCurve(state.lightningLine,progress,state.time).x,
          y: pointOnCurve(state.lightningLine,progress,state.time).y
        },
        end: pointOnCurve(
          target,
          Math.max(0.03, Math.min(0.97, progress + targetJitter)),
          state.time
        ),
        born: now + i * 22,
        life: 105 + Math.random() * 105,
        strength: 1.15 + Math.random() * 0.55
      });
    });
  }

function drawArc(arc, now){
  const age = (now - arc.born) / arc.life;

  if(age >= 1) return false;
  if(age < 0) return true;

  const fade = 1 - age;

  const alpha = Math.min(
    1,
    fade * 1.08 * arc.strength
  );

  const dx = arc.end.x - arc.start.x;
  const dy = arc.end.y - arc.start.y;

  const length = Math.hypot(dx, dy) || 1;

  const perpendicularX = -dy / length;
  const perpendicularY = dx / length;

  /*
    Generate the lightning paths only once.

    This prevents all of the points from jumping
    into new random positions on every frame.
  */
  if(!arc.rays){

    const rayCount = 2;

    arc.rays = [];

    for(let rayIndex = 0; rayIndex < rayCount; rayIndex++){

      const isMainRay = rayIndex === 0;

      const segmentCount =
        isMainRay ? 13 : 11;

      /*
        Secondary bolts remain close to the main bolt.
      */
      const rayOffset =
        rayIndex === 1
          ? -3.5
          : rayIndex === 2
            ? 3.5
            : 0;

      const points = [];

      for(let i = 0; i <= segmentCount; i++){

        const t = i / segmentCount;

        const baseX =
          arc.start.x + dx * t;

        const baseY =
          arc.start.y + dy * t;

        /*
          Zero at the beginning and end.

          This guarantees every bolt connects to
          the exact same stationary endpoints.
        */
        const middleStrength =
          Math.sin(Math.PI * t);

        const jitterStrength =
          middleStrength *
          (
            isMainRay
              ? 12 + Math.random() * 20
              : 7 + Math.random() * 13
          );

        /*
          Most movement occurs perpendicular to the
          direction of the bolt. This looks electrical
          without making it jump forward and backward.
        */
        const sidewaysJitter =
          (Math.random() - 0.5) *
          jitterStrength;

        const forwardJitter =
          (Math.random() - 0.5) *
          jitterStrength *
          0.2;

        points.push({
          x:
            baseX +
            perpendicularX *
            (
              sidewaysJitter +
              rayOffset * middleStrength
            ) +
            dx / length * forwardJitter,

          y:
            baseY +
            perpendicularY *
            (
              sidewaysJitter +
              rayOffset * middleStrength
            ) +
            dy / length * forwardJitter
        });
      }

      /*
        Lock the actual endpoints.
      */
      points[0] = {
        x: arc.start.x,
        y: arc.start.y
      };

      points[points.length - 1] = {
        x: arc.end.x,
        y: arc.end.y
      };

      arc.rays.push({
        points,
        strength:
          isMainRay
            ? 1
            : 0.5 + Math.random() * 0.15,

        phase:
          Math.random() * Math.PI * 2
      });
    }
  }

  ctx.save();

  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  arc.rays.forEach((ray, rayIndex) => {

    const isMainRay = rayIndex === 0;

    /*
      Brightness flickers without changing the
      position or geometry of the lightning.
    */
    const flicker =
      0.83 +
      Math.sin(
        now * 0.045 +
        ray.phase
      ) * 0.12 +
      Math.random() * 0.05;

    const rayAlpha =
      alpha *
      ray.strength *
      flicker;

    // Preserve the bolt shape while its endpoints track their moving curves.
    const start=pointOnCurve(arc.sourceLine,arc.sourceProgress,state.time);
    const end=pointOnCurve(arc.targetLine,arc.targetProgress,state.time);
    const points=ray.points.map((point,index)=>{
      const t=index/(ray.points.length-1);
      return {x:point.x+(start.x-arc.start.x)*(1-t)+(end.x-arc.end.x)*t,
        y:point.y+(start.y-arc.start.y)*(1-t)+(end.y-arc.end.y)*t};
    });

    /*
      Wide blue glow.
    */
    ctx.beginPath();
    ctx.moveTo(
      points[0].x,
      points[0].y
    );

    for(let i = 1; i < points.length; i++){
      ctx.lineTo(
        points[i].x,
        points[i].y
      );
    }

    ctx.strokeStyle =
      `rgba(37,126,255,${rayAlpha * 0.48})`;

    ctx.lineWidth =
      (
        isMainRay
          ? mobile() ? 4.5 : 6.5
          : mobile() ? 2.2 : 3.2
      ) *
      arc.strength;

    ctx.shadowBlur =
      isMainRay ? 34 : 20;

    ctx.shadowColor =
      "rgba(50,135,255,0.95)";

    ctx.stroke();

    /*
      Blue-white inner layer.
    */
    ctx.beginPath();
    ctx.moveTo(
      points[0].x,
      points[0].y
    );

    for(let i = 1; i < points.length; i++){
      ctx.lineTo(
        points[i].x,
        points[i].y
      );
    }

    ctx.strokeStyle =
      `rgba(105,185,255,${rayAlpha * 0.9})`;

    ctx.lineWidth =
      (
        isMainRay
          ? mobile() ? 2 : 2.8
          : mobile() ? 1 : 1.35
      ) *
      arc.strength;

    ctx.shadowBlur =
      isMainRay ? 22 : 13;

    ctx.shadowColor =
      "#398fff";

    ctx.stroke();

    /*
      White-hot core.
    */
    ctx.beginPath();
    ctx.moveTo(
      points[0].x,
      points[0].y
    );

    for(let i = 1; i < points.length; i++){
      ctx.lineTo(
        points[i].x,
        points[i].y
      );
    }

    ctx.strokeStyle =
      `rgba(255,255,255,${rayAlpha})`;

    ctx.lineWidth =
      (
        isMainRay
          ? mobile() ? 0.95 : 1.4
          : mobile() ? 0.5 : 0.72
      ) *
      arc.strength;

    ctx.shadowBlur =
      isMainRay ? 16 : 9;

    ctx.shadowColor =
      "#ffffff";

    ctx.stroke();
  });

  ctx.restore();

  return true;
}
  function drawPulse(pulse,now){
    const age=(now-pulse.born)/1000;
    if(age>1.45)return false;
    const fade=Math.pow(1-age/1.45,2)*pulse.strength;
    ctx.save();
    ctx.globalCompositeOperation='lighter';
    for(const direction of [-1,1]){
      const center=pulse.progress+direction*age*.3;
      if(center<=0 || center>=1)continue;
      for(let i=0;i<9;i++){
        const t=center-direction*i*.004;
        if(t<0 || t>1)continue;
        const a=pointOnCurve(pulse.line,t,state.time);
        const b=pointOnCurve(pulse.line,Math.min(1,t+.003),state.time);
        ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
        ctx.strokeStyle=`rgba(210,238,255,${fade*(1-i/9)*.75})`;
        ctx.lineWidth=1.3;ctx.shadowBlur=9;ctx.shadowColor='#a4cfff';ctx.stroke();
      }
      const tip=pointOnCurve(pulse.line,center,state.time);
      ctx.fillStyle=`rgba(255,255,255,${fade*.7})`;
      ctx.beginPath();ctx.arc(tip.x,tip.y,1.15,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();return true;
  }
  window.addEventListener('pw-logo-spark',event=>{
    if(lineMotion.matches || !lineVisible)return;
    const {x,y}=canvasPoint(event.detail.x,event.detail.y);
    // Find the nearest point on each existing line; no new long paths are added.
    const candidates=lines.map(line=>{
      let best={distance:Infinity,progress:.5};
      for(let i=0;i<=50;i++){
        const point=pointOnCurve(line,i/50,state.time);
        const distance=Math.hypot(point.x-x,point.y-y);
        if(distance<best.distance)best={distance,progress:i/50};
      }
      return {line,...best};
    }).sort((a,b)=>a.distance-b.distance);
    const nearest=candidates[0];
    if(nearest.distance<Math.min(state.width*.35,340)){
      state.pulses.push({line:nearest.line,progress:nearest.progress,born:performance.now(),strength:event.detail.strength});
      state.pulses=state.pulses.slice(-9);
      state.impulseTarget=Math.max(state.impulseTarget,.65);
    }
  });
  function syncLineFrame(){
    if(lineFrame)cancelAnimationFrame(lineFrame);
    lineFrame=0;previousLineTime=0;
    if(lineVisible && !document.hidden)lineFrame=requestAnimationFrame(render);
  }
  document.addEventListener('visibilitychange',syncLineFrame);
  lineMotion.addEventListener('change',()=>{
    state.pulses=[];state.arcBursts=[];state.lightningUntil=0;
    state.impulse=0;state.impulseTarget=0;state.currentNX=0;state.currentNY=0;
    syncLineFrame();
  });
  function render(now){
    lineFrame=0;
    if(!lineVisible || document.hidden)return;
    if(previousLineTime && now-previousLineTime<1000/60-.5){
      lineFrame=requestAnimationFrame(render);return;
    }
    const dt=previousLineTime?Math.min((now-previousLineTime)/1000,.05):1/60;
    previousLineTime=now;
    if(!lineMotion.matches){
      state.time+=dt;
      const smoothing=1-Math.exp(-dt*2.1);
      state.currentNX+=(state.targetNX-state.currentNX)*smoothing;
      state.currentNY+=(state.targetNY-state.currentNY)*smoothing;
      state.impulse+=(state.impulseTarget-state.impulse)*(1-Math.exp(-dt*5));
      state.impulseTarget*=Math.exp(-dt*3);
    }
    ctx.clearRect(0, 0, state.width, state.height);

    // Rear curves are painted first to strengthen the existing intertwined depth.
    [...lines].sort((a,b)=>pointOnCurve(a,.5,state.time).depth-pointOnCurve(b,.5,state.time).depth).forEach(line=>{
      drawLine(line,state.time);drawShine(line,state.time);
    });
    if(lineMotion.matches)return;
    updateTouchState();

    const currentTouchedLineIndex =
      state.touchingLine && state.touchedLine
        ? state.touchedLine.index
        : null;

    /*
      Entering a line, re-entering the same line, or moving directly onto a
      different line starts exactly one new timed lightning sequence.
    */
    if(currentTouchedLineIndex !== state.previousTouchedLineIndex){
      if(currentTouchedLineIndex !== null){
        startLightningSequence(state.touchedLine, state.touchedProgress, now);
      }

      state.previousTouchedLineIndex = currentTouchedLineIndex;
    }

    if(state.lightningLine && now < state.lightningUntil && now >= state.nextArcAt){
      createArcBurst(now);
      state.nextArcAt = now + 115 + Math.random() * 90;
    }

    if(now >= state.lightningUntil){
      state.lightningLine = null;
      state.lightningAnchor = null;
    }

    state.arcBursts = state.arcBursts.filter(arc => drawArc(arc, now));
    state.pulses=state.pulses.filter(pulse=>drawPulse(pulse,now));
    lineFrame=requestAnimationFrame(render);
  }

  hero.addEventListener("pointerenter", event => {
    state.hovering = event.pointerType !== "touch";
  });

  hero.addEventListener("pointermove", event => {
    const {x:nextX,y:nextY}=canvasPoint(event.clientX,event.clientY);
    const now=performance.now();
    if(state.lastMove && now-state.lastMove<140){
      const speed=Math.hypot(nextX-state.pointerX,nextY-state.pointerY)/Math.max(now-state.lastMove,8);
      state.impulseTarget=Math.min(1,speed*.25);
    }
    state.lastMove=now;
    state.pointerX=nextX;state.pointerY=nextY;
    state.targetNX = (state.pointerX / Math.max(state.width, 1) - 0.5) * 2;
    state.targetNY = (state.pointerY / Math.max(state.height, 1) - 0.5) * 2;
    state.hovering = event.pointerType !== "touch";
  });

  hero.addEventListener("pointerleave", () => {
    state.hovering = false;
    state.targetNX = 0;
    state.targetNY = 0;
    state.previousTouchedLineIndex = null;
  });

  window.addEventListener("resize", resize, { passive: true });
  canvas.style.width='100%';canvas.style.height='100%';
  new ResizeObserver(resize).observe(canvas);
  window.visualViewport?.addEventListener('resize',resize,{passive:true});
  resize();
})();

/* Lenis smooth scroll init */
  (() => {
    const lenis = new Lenis({
      autoRaf: true,
      smoothWheel: true,
      syncTouch: true,
      touchMultiplier: 0.8,
      syncTouchLerp: 0.1,
      lerp: 0.1,
      anchors: {
        offset: 110
      }
    });

    window.lenis = lenis;
  })();

/* Showcase stage pinned scroll sequence */
document.addEventListener("DOMContentLoaded", () => {
  const stage = document.getElementById("showcaseStage");
  const track = document.getElementById("showcaseTrack");
  if (!stage || !track) return;

  const panels = Array.prototype.slice.call(track.querySelectorAll(".wrap-showcase-stage__panel"));
  const dots = Array.prototype.slice.call(stage.querySelectorAll(".wrap-showcase-stage__progress span"));
  if (panels.length < 2) return;

  const steps = panels.length - 1;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce) and (max-width: 760px)").matches;
  const lerpAmount = reduceMotion ? 1 : 0.12;

  let targetProgress = 0;
  let currentProgress = 0;
  let activeIndex = 0;

  function measure(){
    const rect = stage.getBoundingClientRect();
    const scrollableHeight = rect.height - window.innerHeight;

    if (scrollableHeight <= 0) {
      targetProgress = 0;
      return;
    }

    const scrolledIntoStage = -rect.top;
    targetProgress = Math.min(1, Math.max(0, scrolledIntoStage / scrollableHeight));
  }

  function render(){
    requestAnimationFrame(render);

    currentProgress += (targetProgress - currentProgress) * lerpAmount;
    if (Math.abs(targetProgress - currentProgress) < 0.0006) {
      currentProgress = targetProgress;
    }

    track.style.transform = "translate3d(" + (-currentProgress * steps * 100) + "%,0,0)";

    const nearestIndex = Math.min(steps, Math.round(targetProgress * steps));
    if (nearestIndex !== activeIndex) {
      activeIndex = nearestIndex;
      dots.forEach((dot, i) => dot.classList.toggle("is-active", i === activeIndex));
    }
  }

  function requestUpdate(){
    measure();
  }

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);

  if (window.lenis && typeof window.lenis.on === "function") {
    window.lenis.on("scroll", requestUpdate);
  }

  window.addEventListener("load", requestUpdate);

  dots.forEach((dot, i) => dot.classList.toggle("is-active", i === 0));
  requestUpdate();
  requestAnimationFrame(render);
});

/* Intersection-observer reveal-on-scroll */
document.addEventListener("DOMContentLoaded", () => {
  const revealTargets = document.querySelectorAll(
    ".wrap-branding-intro h2, .wrap-branding-intro__subtitle, .wrap-branding-intro__desc, .wrap-branding-card"
  );
  if (!revealTargets.length) return;

  if (!("IntersectionObserver" in window)) {
    revealTargets.forEach((el) => el.classList.add("is-inview"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-inview");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -10% 0px" });

  revealTargets.forEach((el) => observer.observe(el));
});
