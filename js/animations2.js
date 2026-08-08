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
    Math.min(
      window.devicePixelRatio || 1,
      2
    )
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

  function animateTerrain(){
    requestAnimationFrame(
      animateTerrain
    );

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
      Math.min(
        window.devicePixelRatio || 1,
        2
      )
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

if (symbolContainer) {
  const symbolScene =
    new THREE.Scene();

  symbolCamera =
    new THREE.PerspectiveCamera(
      35,
      symbolContainer.clientWidth /
        symbolContainer.clientHeight,
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

  symbolRenderer.setPixelRatio(
    Math.min(
      window.devicePixelRatio,
      2
    )
  );

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
    34,
    8
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

  let logoHoverAmount = 0;

  let model = null;

  const modelParts = [];

  const startRotationX = 0;
  const startRotationY = 0;

  let targetRotationX =
    startRotationX;

  let targetRotationY =
    startRotationY;

  const expansionDistance =
    0.8;

  const influenceRadius =
    280;

  const fullStrengthRadius =
    48;

  const expansionSmoothing =
    0.095;

  const rotationSmoothing =
    0.28;

  const pointer = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    active: false
  };

  /*
    Raycasting is used so hover activates only when the cursor is
    over actual visible logo geometry—not anywhere inside its canvas.
  */
  const logoRaycaster = new THREE.Raycaster();
  const logoPointerNdc = new THREE.Vector2();

  let wasPointerActive = false;

  function randomizeExpansionDirections(){
    modelParts.forEach((part, index) => {
      /* Keep the recognizable outward split, but vary each rollover slightly. */
      const randomVariation = new THREE.Vector3(
        (Math.random() - 0.5) * 0.34,
        (Math.random() - 0.5) * 0.30,
        (Math.random() - 0.5) * 0.42
      );

      const patternedVariation = new THREE.Vector3(
        Math.sin(index * 1.91 + Math.random() * 0.8) * 0.12,
        Math.cos(index * 1.47 + Math.random() * 0.8) * 0.10,
        Math.sin(index * 2.53 + Math.random()) * 0.16
      );

      part.movementDirection
        .copy(part.baseMovementDirection)
        .multiplyScalar(0.86)
        .add(randomVariation)
        .add(patternedVariation)
        .normalize();

      part.distanceVariation = THREE.MathUtils.clamp(
        part.baseDistanceVariation * (0.90 + Math.random() * 0.22),
        0.72,
        1.28
      );
    });
  }

  const loader =
    new GLTFLoader();

  loader.load(
    "/images/icon2.glb",

    function(gltf){
      model = gltf.scene;

      /*
        The foreground camera is separate,
        so zero is truly centered.
      */
      model.position.set(
        0,
        0,
        0
      );

      model.scale.set(
        1,
        1,
        1
      );

      symbolScene.add(
        model
      );

      model.updateMatrixWorld(
        true
      );

      const modelBox =
        new THREE.Box3()
          .setFromObject(model);

      const modelCenter =
        new THREE.Vector3();

      modelBox.getCenter(
        modelCenter
      );

      /*
        Center the actual geometry, not just
        the GLB object's origin.
      */
      model.position.sub(
        modelCenter
      );

      model.updateMatrixWorld(
        true
      );

      const centeredBox =
        new THREE.Box3()
          .setFromObject(model);

      const centeredModelCenter =
        new THREE.Vector3();

      centeredBox.getCenter(
        centeredModelCenter
      );

      model.traverse(
        function(child){
          if(!child.isMesh) return;

          const sourceMaterial = Array.isArray(child.material)
            ? child.material[0]
            : child.material;

          child.material = new THREE.MeshPhysicalMaterial({
            /*
              Solid smoked-glass finish:
              visually glassy and reflective, but fully opaque.
            */
            color: new THREE.Color(0x16191d),
            metalness: 0.42,
            roughness: 0.085,

            /* Keep the logo solid—no background can be seen through it. */
            transparent: false,
            opacity: 1,
            transmission: 0,

            ior: 1.52,

            /* Strong polished outer coating creates the glass-like surface. */
            clearcoat: 1,
            clearcoatRoughness: 0.045,

            /* Controlled cool reflections without turning the body blue. */
            specularIntensity: 1,
            specularColor: new THREE.Color(0xf2f4f7),

            sheen: 0.24,
            sheenColor: new THREE.Color(0xc7cbd1),
            sheenRoughness: 0.28,

            /* Extremely subtle optical color shift at grazing angles. */
            iridescence: 0.035,
            iridescenceIOR: 1.2,
            iridescenceThicknessRange: [70, 150],

            side: THREE.DoubleSide,
            depthWrite: true,

            /* Keeps the dark faces readable between moving light passes. */
            emissive: new THREE.Color(0x08090b),
            emissiveIntensity: 0.24
          });

          if(sourceMaterial && sourceMaterial.map){
            child.material.map = sourceMaterial.map;
            child.material.needsUpdate = true;
          }

          const originalPosition =
            child.position.clone();
            

          const partBox =
            new THREE.Box3()
              .setFromObject(child);

          const partWorldCenter =
            new THREE.Vector3();

          partBox.getCenter(
            partWorldCenter
          );

          const localCenter =
            child.worldToLocal(
              partWorldCenter.clone()
            );

          const worldDirection =
            partWorldCenter
              .clone()
              .sub(
                centeredModelCenter
              );

          if(
            worldDirection.lengthSq() <
            0.00001
          ){
            worldDirection.set(
              0,
              1,
              0
            );
          }

          worldDirection.normalize();

          const localDirection =
            worldDirection.clone();

          if(child.parent){
            const parentQuaternion =
              new THREE.Quaternion();

            child.parent
              .getWorldQuaternion(
                parentQuaternion
              );

            parentQuaternion.invert();

            localDirection
              .applyQuaternion(
                parentQuaternion
              );
          }

          localDirection.normalize();

          const partIndex =
            modelParts.length;

          const variation =
            new THREE.Vector3(
              Math.sin(
                partIndex * 2.17
              ) * 0.34,

              Math.cos(
                partIndex * 1.73
              ) * 0.27,

              Math.sin(
                partIndex * 3.11 +
                0.8
              ) * 0.58
            );

          const movementDirection =
            localDirection
              .clone()
              .multiplyScalar(0.76)
              .add(variation)
              .normalize();

          const distanceVariation =
            0.8 +
            Math.abs(
              Math.sin(
                partIndex * 1.91
              )
            ) * 0.24;

          modelParts.push({
            mesh: child,
            originalPosition,
            localCenter,
            movementDirection: movementDirection.clone(),
            baseMovementDirection: movementDirection.clone(),
            distanceVariation,
            baseDistanceVariation: distanceVariation,
            currentInfluence: 0,
            targetInfluence: 0,
            wobblePhase: partIndex * 0.61 + Math.random() * Math.PI * 2,
            wobbleSpeed: 0.55 + Math.random() * 0.65,
            wobbleAxis: new THREE.Vector3(
              Math.random() - 0.5,
              Math.random() - 0.5,
              Math.random() - 0.5
            ).normalize(),
            worldCenter:
              new THREE.Vector3(),
            projectedCenter:
              new THREE.Vector3(),
            targetPosition:
              new THREE.Vector3()
          });
        }
      );
    },

    undefined,

    function(error){
      console.error(
        "GLB Load Failed:",
        error
      );
    }
  );

  window.addEventListener(
    "pointermove",
    function(event){
      pointer.x =
        event.clientX;

      pointer.y =
        event.clientY;

      const rect =
        symbolContainer
          .getBoundingClientRect();

      let isDirectlyOverLogo = false;

      if(model){
        logoPointerNdc.x =
          ((pointer.x - rect.left) / Math.max(rect.width, 1)) * 2 - 1;

        logoPointerNdc.y =
          -((pointer.y - rect.top) / Math.max(rect.height, 1)) * 2 + 1;

        logoRaycaster.setFromCamera(
          logoPointerNdc,
          symbolCamera
        );

        const logoHits =
          logoRaycaster.intersectObject(
            model,
            true
          );

        isDirectlyOverLogo =
          logoHits.length > 0;
      }

      window.performanteLogoHover =
        isDirectlyOverLogo;

      pointer.active =
        pointer.x >=
          rect.left -
          influenceRadius &&

        pointer.x <=
          rect.right +
          influenceRadius &&

        pointer.y >=
          rect.top -
          influenceRadius &&

        pointer.y <=
          rect.bottom +
          influenceRadius;

      if(pointer.active && !wasPointerActive){
        randomizeExpansionDirections();
      }

      wasPointerActive = pointer.active;

      const normalizedX =
        (
          event.clientX -
          rect.left
        ) /
        Math.max(
          rect.width,
          1
        ) -
        0.5;

      const normalizedY =
        (
          event.clientY -
          rect.top
        ) /
        Math.max(
          rect.height,
          1
        ) -
        0.5;

      targetRotationY =
        startRotationY +
        normalizedX * 0.4;

      targetRotationX =
        startRotationX +
        normalizedY * 0.32;
    }
  );

  document.addEventListener(
    "mouseleave",
    function(){
      pointer.active = false;
      wasPointerActive = false;
      window.performanteLogoHover = false;

      targetRotationX =
        startRotationX;

      targetRotationY =
        startRotationY;
    }
  );

  function updateParts(time){
    if(!model) return;

    const rect =
      symbolRenderer.domElement
        .getBoundingClientRect();

    model.updateMatrixWorld(
      true
    );

    modelParts.forEach(
      function(part){
        part.worldCenter.copy(
          part.localCenter
        );

        part.mesh.localToWorld(
          part.worldCenter
        );

        part.projectedCenter
          .copy(
            part.worldCenter
          )
          .project(
            symbolCamera
          );

        const screenX =
          rect.left +
          (
            part.projectedCenter.x *
            0.5 +
            0.5
          ) *
          rect.width;

        const screenY =
          rect.top +
          (
            -part.projectedCenter.y *
            0.5 +
            0.5
          ) *
          rect.height;

        const dx =
          pointer.x -
          screenX;

        const dy =
          pointer.y -
          screenY;

        const distance =
          Math.sqrt(
            dx * dx +
            dy * dy
          );

        let influence = 0;

        if(pointer.active){
          influence =
            1 -
            THREE.MathUtils
              .smoothstep(
                distance,
                fullStrengthRadius,
                influenceRadius
              );
        }

        part.targetInfluence =
          influence;

        part.currentInfluence +=
          (
            part.targetInfluence -
            part.currentInfluence
          ) *
          expansionSmoothing;

        part.targetPosition
          .copy(
            part.originalPosition
          )
          .addScaledVector(
            part.movementDirection,
            expansionDistance *
            part.distanceVariation *
            part.currentInfluence
          );

        /*
          Each part nudges on its own, independent of the
          shared outward direction, so the spread doesn't
          look identical every time it triggers.
        */
        const wobbleAmount =
          0.22 *
          part.currentInfluence;

        part.targetPosition.addScaledVector(
          part.wobbleAxis,
          Math.sin(
            time * part.wobbleSpeed +
            part.wobblePhase
          ) *
          wobbleAmount
        );

        part.mesh.position.lerp(
          part.targetPosition,
          expansionSmoothing
        );
      }
    );
  }

  const symbolClock = new THREE.Clock();
  let automaticRotation = 0;

  function animateSymbol(){
    requestAnimationFrame(animateSymbol);

    const symbolTime = symbolClock.getElapsedTime();
    automaticRotation += 0.0016;

    const logoHoverTarget = window.performanteLogoHover ? 1 : 0;
    logoHoverAmount += (logoHoverTarget - logoHoverAmount) * 0.075;

    /*
      Slow, broad movement keeps the reflected color transitions soft.
      The lights travel large distances very gradually, preventing hard
      circular hot spots from crossing the logo.
    */
    whiteLight.position.x = 11 + Math.cos(symbolTime * 0.09) * 7.5;
    whiteLight.position.y = 6 + Math.sin(symbolTime * 0.075) * 3.2;
    whiteLight.position.z = 16 + Math.sin(symbolTime * 0.065) * 2.0;
    whiteLight.target.position.x = Math.sin(symbolTime * 0.055) * 1.0;
    whiteLight.target.position.y = Math.cos(symbolTime * 0.05) * 0.5;
    whiteLight.intensity = 32 + Math.sin(symbolTime * 0.12) * 3.5;

    softLight.position.x = -12 + Math.cos(symbolTime * 0.075 + Math.PI) * 7.0;
    softLight.position.y = -1 + Math.cos(symbolTime * 0.06) * 3.0;
    softLight.position.z = 15 + Math.sin(symbolTime * 0.07 + Math.PI) * 1.8;
    softLight.target.position.x = Math.cos(symbolTime * 0.045) * 0.8;
    softLight.target.position.y = Math.sin(symbolTime * 0.055) * 0.6;
    softLight.intensity = 25 + Math.sin(symbolTime * 0.105 + 1.5) * 2.8;

    rimLight.position.x = 4 + Math.sin(symbolTime * 0.06) * 4.5;
    rimLight.position.y = 10 + Math.cos(symbolTime * 0.07) * 3.2;
    rimLight.intensity = 20 + Math.sin(symbolTime * 0.11) * 2.4;

    redAccentLight.position.x = -8 + Math.sin(symbolTime * 0.065) * 4.0;
    redAccentLight.position.y = -7 + Math.cos(symbolTime * 0.06) * 2.6;
    redAccentLight.intensity =
      6.5 +
      Math.max(
        0,
        Math.sin(symbolTime * 0.09 - 1.1)
      ) * 3.0;

    visibilityLight.intensity = 4.75 + Math.sin(symbolTime * 0.24) * 0.34;
    logoKeyLight.intensity = 3.45 + Math.sin(symbolTime * 0.19 + 0.7) * 0.26;
    logoSideFill.intensity = 2.65 + Math.sin(symbolTime * 0.16 + 1.1) * 0.18;
    logoLowerFill.intensity = 2.05 + Math.sin(symbolTime * 0.21 + 2.0) * 0.16;

    /*
      Very slow oversized softbox drift creates broad gradient bands.
      Their dimensions and distance keep the panel edges out of view.
    */
    studioKey.position.x = -10 + Math.sin(symbolTime * 0.055) * 5.0;
    studioKey.position.y = 8 + Math.cos(symbolTime * 0.045) * 2.0;
    studioKey.position.z = 15 + Math.sin(symbolTime * 0.04) * 1.2;
    studioKey.intensity = 7.0 + Math.sin(symbolTime * 0.085) * 0.75;
    studioKey.lookAt(0, 0.15, 0);

    studioSweep.position.x = 11 + Math.cos(symbolTime * 0.05) * 5.5;
    studioSweep.position.y = 2 + Math.sin(symbolTime * 0.06) * 2.8;
    studioSweep.position.z = 15 + Math.cos(symbolTime * 0.04) * 1.1;
    studioSweep.intensity = 5.6 + Math.sin(symbolTime * 0.075 + 1.4) * 0.65;
    studioSweep.lookAt(0, 0, 0);

    studioTopStrip.position.x = Math.sin(symbolTime * 0.04) * 5.0;
    studioTopStrip.position.y = 12 + Math.cos(symbolTime * 0.045) * 1.3;
    studioTopStrip.position.z = 10 + Math.cos(symbolTime * 0.05) * 1.5;
    studioTopStrip.intensity = 5.2 + Math.sin(symbolTime * 0.07 + 0.5) * 0.6;
    studioTopStrip.lookAt(0, 0.1, 0);

    studioRedStrip.position.x = -9 + Math.sin(symbolTime * 0.05 + 1.7) * 5.0;
    studioRedStrip.position.y = -8 + Math.cos(symbolTime * 0.045) * 1.8;
    studioRedStrip.intensity =
      1.7 +
      Math.max(
        0,
        Math.sin(symbolTime * 0.07 - 0.7)
      ) * 0.8;
    studioRedStrip.lookAt(0, -0.35, 0);

    edgeKeyLeft.position.y = 3.6 + Math.sin(symbolTime * 0.19) * 1.5;
    edgeKeyLeft.intensity = 46 + Math.sin(symbolTime * 0.33) * 5 + logoHoverAmount * 18;

    edgeKeyRight.position.y = -1.8 + Math.cos(symbolTime * 0.21) * 1.7;
    edgeKeyRight.intensity = 42 + Math.sin(symbolTime * 0.29 + 1.2) * 5 + logoHoverAmount * 16;

    whiteEdgeRim.position.x = -5.5 + Math.sin(symbolTime * 0.16) * 2.2;
    whiteEdgeRim.position.y = 4.2 + Math.cos(symbolTime * 0.18) * 1.2;
    whiteEdgeRim.intensity = 2.2 + logoHoverAmount * 4.8;

    redEdgeRim.position.x = 5.8 + Math.cos(symbolTime * 0.15) * 2.0;
    redEdgeRim.position.y = -2.8 + Math.sin(symbolTime * 0.17) * 1.3;
    redEdgeRim.intensity = 1.35 + logoHoverAmount * 3.6;

    lowerRedRim.position.x = -1.8 + Math.sin(symbolTime * 0.22) * 2.4;
    lowerRedRim.intensity = 18 + logoHoverAmount * 32;

    if(model){
      const pointerTiltX = targetRotationX * 0.6;
      const pointerTiltY = targetRotationY * 0.6;

      model.rotation.x +=
        (pointerTiltX + Math.sin(symbolTime * 0.38) * 0.05 - model.rotation.x) *
        0.035;

      model.rotation.y +=
        (automaticRotation + pointerTiltY - model.rotation.y) *
        0.045;

      model.rotation.z = Math.sin(symbolTime * 0.24) * 0.025;

      updateParts(symbolTime);
    }

    symbolRenderer.render(
      symbolScene,
      symbolCamera
    );
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

    symbolCamera.aspect =
      width / height;

    symbolCamera
      .updateProjectionMatrix();

    symbolRenderer.setSize(
      width,
      height,
      false
    );
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
  const state = {
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

  function resize(){
    const rect = hero.getBoundingClientRect();
    state.width = Math.max(1, rect.width);
    state.height = Math.max(1, rect.height);
    state.dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(state.width * state.dpr);
    canvas.height = Math.round(state.height * state.dpr);
    canvas.style.width = state.width + "px";
    canvas.style.height = state.height + "px";
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
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

    return {
      x: curveX + orbitX,
      y: curveY + crossover + orbitY,
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
    const depthBrightness = 0.17 + (midDepth + 1) * 0.055;
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
    state.lightningUntil = now + 650;
    state.nextArcAt = now;
  }

 function createArcBurst(now){
    if(!state.lightningLine || now >= state.lightningUntil) return;

    const sourceIndex = state.lightningLine.index;
    const progress = state.lightningProgress;
    const targets = lines.filter(line => line.index !== sourceIndex);

    targets.forEach((target, i) => {
      /* The hovered-line connection stays perfectly fixed. Only the opposite endpoint moves. */
      const targetJitter = (Math.random() - 0.5) * 0.003;

      state.arcBursts.push({
        start: {
          x: state.lightningAnchor.x,
          y: state.lightningAnchor.y
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

    const rayCount = 3;

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

    const points = ray.points;

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
  function render(now){
    state.time = now * 0.001;
    state.currentNX += (state.targetNX - state.currentNX) * 0.025;
    state.currentNY += (state.targetNY - state.currentNY) * 0.025;
    ctx.clearRect(0, 0, state.width, state.height);

    lines.forEach(line => {
      drawLine(line, state.time);
      drawShine(line, state.time);
    });

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
    requestAnimationFrame(render);
  }

  hero.addEventListener("pointerenter", event => {
    state.hovering = event.pointerType !== "touch";
  });

  hero.addEventListener("pointermove", event => {
    const rect = hero.getBoundingClientRect();
    state.pointerX = event.clientX - rect.left;
    state.pointerY = event.clientY - rect.top;
    state.targetNX = (state.pointerX / Math.max(rect.width, 1) - 0.5) * 2;
    state.targetNY = (state.pointerY / Math.max(rect.height, 1) - 0.5) * 2;
    state.hovering = event.pointerType !== "touch";
  });

  hero.addEventListener("pointerleave", () => {
    state.hovering = false;
    state.targetNX = 0;
    state.targetNY = 0;
    state.previousTouchedLineIndex = null;
  });

  window.addEventListener("resize", resize, { passive: true });
  resize();
  requestAnimationFrame(render);
})();

/* Lenis smooth scroll init */
  (() => {
    const lenis = new Lenis({
      autoRaf: true,
      smoothWheel: true,
      syncTouch: false,
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
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
