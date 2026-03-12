"""Starter prompts and seed programs for initial sessions."""

SEED_PROMPTS = {
    "strudel": (
        "Generate 6 diverse Strudel (strudel.cc) programs that showcase different "
        "musical styles and patterns. Include:\n"
        "1. A simple drum pattern\n"
        "2. A melodic pattern with a synth\n"
        "3. A polyrhythmic pattern\n"
        "4. An ambient/pad texture\n"
        "5. A bass-heavy pattern\n"
        "6. An experimental/unusual pattern\n\n"
        "Each should be concise (1-3 lines) and produce interesting sounds.\n"
        "Output each in a ```strudel``` code block."
    ),
    "shader": (
        "Generate 6 diverse GLSL fragment shaders using the mainImage convention. "
        "Include:\n"
        "1. A geometric pattern (circles, grids, or polygons)\n"
        "2. A color gradient animation\n"
        "3. A noise/organic texture using FBM with a for loop\n"
        "4. A spiral or radial pattern\n"
        "5. An abstract composition with helper functions\n"
        "6. An experimental/wild visual\n\n"
        "Use iTime for animation. Helper functions and for loops are encouraged.\n"
        "Output each in a ```glsl``` code block."
    ),
}
