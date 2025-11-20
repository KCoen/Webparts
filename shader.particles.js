shaderParticles = function()
{
	this.C = {};
	this.C.particleCount = 1000000;
	this.C.size = 10;
	this.pMatrix = mat4.create();
	this.callCount = 0;
	mat4.ortho(this.pMatrix, 0, gl.viewportWidth, 0, gl.viewportHeight, 0, 100);
}
shaderParticles.prototype = Object.create(shader.prototype);

shaderParticles.prototype.initGL = function()
{
	var fragmentShader = this.getShader(gl, "particle-shader-fs");
    var vertexShader = this.getShader(gl, "particle-shader-vs");

    this.shaderProgram = gl.createProgram();
    gl.attachShader(this.shaderProgram, vertexShader);
    gl.attachShader(this.shaderProgram, fragmentShader);
    gl.linkProgram(this.shaderProgram);
	
	//console.log(gl2.getTranslatedShaderSource(fragmentShader));

    if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS)) {
        console.log("Could not initialise shaders");
    }

    gl.useProgram(this.shaderProgram);

    this.vertexPositionAttribute = gl.getAttribLocation(this.shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(this.vertexPositionAttribute);

    this.pMatrixUniform = gl.getUniformLocation(this.shaderProgram, "uPMatrix");
	this.uAttractorsUniform = gl.getUniformLocation(this.shaderProgram, "uAttractors");
	this.samplerUniform = gl.getUniformLocation(this.shaderProgram, "uSampler");
	this.callCountUniform = gl.getUniformLocation(this.shaderProgram, "uCallCount");
	
	this.rttFramebuffer = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.rttFramebuffer);
	this.rttFramebuffer.width = 4096;
	this.rttFramebuffer.height = 4096;

	this.proxyTexture = gl.createTexture(); // WebGL spec change to disallow simultanious reading/rendering to the framebuffer.
	gl.bindTexture(gl.TEXTURE_2D, this.proxyTexture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.rttFramebuffer.width, this.rttFramebuffer.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	
	this.rttTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, this.rttTexture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.rttFramebuffer.width, this.rttFramebuffer.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);


	
	this.renderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, this.renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.rttFramebuffer.width, this.rttFramebuffer.height);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.rttTexture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.renderbuffer);
	
	gl.clearColor(0.0, 0.0, 0.0, 0.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.disable(gl.BLEND);
	gl.disable(gl.DEPTH_TEST);
	
	gl.bindTexture(gl.TEXTURE_2D, null);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

}
shaderParticles.prototype.initBuffers = function()
{
	this.vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
	
	var vertices = new Float32Array(this.C.particleCount * 4);
	
	var offset = 0;
	var size = this.C.size; // Shorthand
	while(offset < this.C.particleCount * 4)
	{
		vertices[offset] = (Math.random() * size - size/2);
		vertices[offset +1] = (Math.random() * size - size/2);
		vertices[offset +2] = (Math.random() * size - size/2);
		vertices[offset +3] = offset / 4;
		
		offset = offset + 4;
	}
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
	
	this.attractors = new Float32Array(4*4); //Syntax
	offset = 0;
	
	while(offset < 4 * 4) //Syntax
	{
		this.attractors[offset] = Math.random() * size - size/2;
		this.attractors[offset + 1] = Math.random() * size - size/2;
		this.attractors[offset + 2] = Math.random() * size - size/2;
		this.attractors[offset + 3] = 0.005; //Syntax
		
		offset = offset + 4;
	}
}

shaderParticles.prototype.draw = function()
{
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.rttFramebuffer);
	gl.disable(gl.BLEND);

	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	
	gl.useProgram(this.shaderProgram);
   
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
	gl.vertexAttribPointer(this.vertexPositionAttribute, 4, gl.FLOAT, false, 0, 0);
	
	gl.uniformMatrix4fv(this.pMatrixUniform, false, this.pMatrix);
	gl.uniformMatrix4fv(this.uAttractorsUniform, false, this.attractors);
	
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, this.proxyTexture);
	gl.uniform1i(this.samplerUniform, 0);
	gl.uniform1i(this.callCountUniform, this.callCount);
	
	gl.drawArrays(gl.POINT, 0, this.C.particleCount);
	
	this.callCount = this.callCount + 1;

	gl.bindTexture(gl.TEXTURE_2D, this.proxyTexture)
	gl.copyTexSubImage2D(
	    gl.TEXTURE_2D,
	    0,        // mip level
	    0, 0,     // dst x,y
	    0, 0,     // src x,y
	    this.rttFramebuffer.width,
	    this.rttFramebuffer.height
	);
	
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}
