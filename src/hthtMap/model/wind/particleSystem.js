import {
  ClearCommand, Color, Pass, VertexArray, BufferUsage
} from 'cesium'
import ParticlesComputing from './particlesComputing'
import ParticlesRendering from './particlesRendering'

export default class ParticleSystem {
  constructor(context, data, userInput, viewerParameters) {
    this.context = context
    this.data = data
    this.userInput = userInput
    this.viewerParameters = viewerParameters

    this.particlesComputing = new ParticlesComputing(
      this.context, this.data,
      this.userInput, this.viewerParameters
    )
    this.particlesRendering = new ParticlesRendering(
      this.context, this.data,
      this.userInput, this.viewerParameters,
      this.particlesComputing
    )
  }

  canvasResize(context) {
    this.particlesComputing.destroyParticlesTextures()
    Object.keys(this.particlesComputing.windTextures).forEach((key) => {
      this.particlesComputing.windTextures[key].destroy()
    })

    this.particlesRendering.textures.colorTable.destroy()
    Object.keys(this.particlesRendering.framebuffers).forEach((key) => {
      this.particlesRendering.framebuffers[key].destroy()
    })

    this.context = context
    this.particlesComputing = new ParticlesComputing(
      this.context, this.data,
      this.userInput, this.viewerParameters
    )
    this.particlesRendering = new ParticlesRendering(
      this.context, this.data,
      this.userInput, this.viewerParameters,
      this.particlesComputing
    )
  }

  clearFramebuffers() {
    const clearCommand = new ClearCommand({
      color: new Color(0.0, 0.0, 0.0, 0.0),
      depth: 1.0,
      framebuffer: undefined,
      pass: Pass.OPAQUE
    })

    Object.keys(this.particlesRendering.framebuffers).forEach((key) => {
      clearCommand.framebuffer = this.particlesRendering.framebuffers[key]
      clearCommand.execute(this.context)
    })
  }

  refreshParticles(maxParticlesChanged) {
    this.clearFramebuffers()

    this.particlesComputing.destroyParticlesTextures()
    this.particlesComputing.createParticlesTextures(this.context, this.userInput, this.viewerParameters)

    if (maxParticlesChanged) {
      const geometry = this.particlesRendering.createSegmentsGeometry(this.userInput)
      this.particlesRendering.primitives.segments.geometry = geometry
      const vertexArray = VertexArray.fromGeometry({
        context: this.context,
        geometry: geometry,
        attributeLocations: this.particlesRendering.primitives.segments.attributeLocations,
        bufferUsage: BufferUsage.STATIC_DRAW
      })
      this.particlesRendering.primitives.segments.commandToExecute.vertexArray = vertexArray
    }
  }

  applyUserInput(userInput) {
    let maxParticlesChanged = false
    if (this.userInput.maxParticles !== userInput.maxParticles) {
      maxParticlesChanged = true
    }

    Object.keys(userInput).forEach((key) => {
      this.userInput[key] = userInput[key]
    })
    this.refreshParticles(maxParticlesChanged)
  }

  applyViewerParameters(viewerParameters) {
    Object.keys(viewerParameters).forEach((key) => {
      this.viewerParameters[key] = viewerParameters[key]
    })
    this.refreshParticles(false)
  }
}
