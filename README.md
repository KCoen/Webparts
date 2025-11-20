Webparts
========

A hardware accelerate GPU particles, POC.
POC for abusing framebuffers as OpenGL ES 2.0 compatible Feedback buffers.

At some point this code was functional in All browsers, both under OpenGL or ANGLE, but currently under ANGLE only works on Firefox.

## [1 million parcticle demo](https://kcoen.github.io/Webparts/main.html)

How it works
========

The code mainly exists out of 2 shaders.

A. Simulate the particles output data as colors, write to a texture, and then feed the texture back to itself.
B. Read from the particle simulation data and display the particles on the screen.

Simulating of particles is done in the vertex shader,
The vertex shader does a very simple physics/particle simulation, the presistend betwheen-frame data is then compressed into colors.
Vertices are in this case rendered as 3x3 dots, and the colors to output are passed from the vertex shader to the fragment shader using varyings.

The shader renders to a texture which is then fed back into the shader to create a sort-off feedback-buffer.

The second shader simply reads from the texture output by the first shader, and locatates the points according to the data in the texture.

