<template>
  <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <!-- Robot Head -->
  <rect x="50" y="50" width="100" height="100" rx="15" ry="15" fill="#888" stroke="#333" stroke-width="5"/>
  
  <!-- Robot Eyes -->
  <circle cx="80" cy="85" r="10" fill="#FFF" stroke="#333" stroke-width="3">
    <animate attributeName="r" values="10;8;10" dur="1s" repeatCount="indefinite"/>
  </circle>
  <circle cx="120" cy="85" r="10" fill="#FFF" stroke="#333" stroke-width="3">
    <animate attributeName="r" values="10;8;10" dur="1s" repeatCount="indefinite" begin="0.5s"/>
  </circle>
  
  <!-- Robot Mouth -->
  <rect x="85" y="120" width="30" height="8" rx="4" ry="4" fill="#333"/>

  <!-- Thought Gear 1 -->
  <g>
    <circle cx="40" cy="40" r="15" fill="#888" stroke="#333" stroke-width="3"/>
    <line x1="40" y1="25" x2="40" y2="40" stroke="#333" stroke-width="2"/>
    <line x1="40" y1="40" x2="50" y2="50" stroke="#333" stroke-width="2"/>
    <line x1="40" y1="40" x2="30" y2="50" stroke="#333" stroke-width="2"/>
    <animateTransform attributeName="transform" type="rotate" from="0 40 40" to="360 40 40" dur="2s" repeatCount="indefinite"/>
  </g>
  
  <!-- Thought Gear 2 -->
  <g>
    <circle cx="160" cy="40" r="10" fill="#888" stroke="#333" stroke-width="3"/>
    <line x1="160" y1="30" x2="160" y2="40" stroke="#333" stroke-width="2"/>
    <line x1="160" y1="40" x2="167" y2="47" stroke="#333" stroke-width="2"/>
    <line x1="160" y1="40" x2="153" y2="47" stroke="#333" stroke-width="2"/>
    <animateTransform attributeName="transform" type="rotate" from="0 160 40" to="-360 160 40" dur="3s" repeatCount="indefinite"/>
  </g>
  
  <!-- Thought Bubble -->
  <circle cx="100" cy="30" r="5" fill="#888">
    <animate attributeName="r" values="5;10;5" dur="1.5s" repeatCount="indefinite"/>
  </circle>

  <!-- Base Thought Bubble -->
  <circle cx="100" cy="15" r="2.5" fill="#888">
    <animate attributeName="r" values="2.5;5;2.5" dur="1.5s" repeatCount="indefinite"/>
  </circle>
</svg>

</template>