#include <stdio.h>

#include <SDL2/SDL.h>
#include <GL/glew.h>

#include "debug.h"

const int WIDTH  = 1200;
const int HEIGHT = 900;

static const int vertices[] =
{
	-1, -1,
	 1, -1,
	 1,  1,
	-1, -1,
	 1,  1,
	-1,  1
};

char* load_shader_file(const char* filepath)
{
	// define pointer to file
	FILE *fp = fopen(filepath, "r");
	fseek(fp, 0, SEEK_END);
	size_t fsize = ftell(fp);
	fseek(fp, 0, SEEK_SET);

	// allocate memory buffer the size of the file
	// add 1 byte for the null termination
	char *shader = malloc(fsize + 1);
	if (shader == NULL) {
		printf("Failed to allocate memory!\n");
		return NULL;
	}

	if (fread(shader, 1, fsize, fp) != fsize){
		printf("Failed to read file: %s\n", filepath);
		return NULL;
	}
	fclose(fp);

	// terminate the string with a 0
	shader[fsize] = 0;
	return shader;
}

int main()
{
	SDL_Init(SDL_INIT_VIDEO);
	SDL_Window* window = SDL_CreateWindow(
		"Ray Marching Demo",
		SDL_WINDOWPOS_CENTERED,
		SDL_WINDOWPOS_CENTERED,
		WIDTH,
		HEIGHT,
		SDL_WINDOW_OPENGL 
	);

	SDL_GL_SetAttribute(SDL_GL_CONTEXT_FLAGS, SDL_GL_CONTEXT_DEBUG_FLAG);
	SDL_GL_SetAttribute(SDL_GL_CONTEXT_MAJOR_VERSION, 4);
	SDL_GL_SetAttribute(SDL_GL_CONTEXT_MINOR_VERSION, 3);
	SDL_GLContext glcontext = SDL_GL_CreateContext(window);
	SDL_GL_SetSwapInterval(1);	// limits the frame swap interval to the refresh rate

	if (glewInit() != GLEW_OK)
	{
		printf("[Error]: GLEW failed to initialize!\n");
		SDL_GL_DeleteContext(glcontext);
		SDL_DestroyWindow(window);
		SDL_Quit();
		return 1;
	}

	glEnable(GL_DEBUG_OUTPUT | GL_DEBUG_OUTPUT_SYNCHRONOUS);
	glDebugMessageCallback(MessageCallback, NULL);

	unsigned int vao;
	glGenVertexArrays(1, &vao);
	glBindVertexArray(vao);

	unsigned int vbo;
	glGenBuffers(1, &vbo);
	glBindBuffer(GL_ARRAY_BUFFER, vbo);
	glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
	glEnableVertexAttribArray(0);
	glVertexAttribPointer(0, 2, GL_INT, GL_FALSE, 0, NULL);

	const char* vssource = load_shader_file("shaders/basic.vert");
	unsigned int vs = glCreateShader(GL_VERTEX_SHADER);
	glShaderSource(vs, 1, &vssource, NULL);
	glCompileShader(vs);
	
	const char* fssource = load_shader_file("shaders/basic.frag");
	unsigned int fs = glCreateShader(GL_FRAGMENT_SHADER);
	glShaderSource(fs, 1, &fssource, NULL);
	glCompileShader(fs);

	unsigned int shader_program = glCreateProgram();
	glAttachShader(shader_program, vs);
	glAttachShader(shader_program, fs);
	glLinkProgram(shader_program);

	glDeleteShader(vs);
	glDeleteShader(fs);

	glUseProgram(shader_program);

	unsigned int uid_resolution = glGetUniformLocation(shader_program, "u_resolution");
	unsigned int uid_time       = glGetUniformLocation(shader_program, "u_time");

	int window_alive = 1;
	float time = 0.0f;
	while(window_alive)
	{
		SDL_Event event;
		while(SDL_PollEvent(&event))
		{
			switch(event.type)
			{
				case SDL_KEYDOWN:
					switch(event.key.keysym.sym)
					{
						case 'q':
							window_alive = 0;
							break;
					}
					break;

				case SDL_QUIT:
					window_alive = 0;
					break;
			}
		}

		glClearColor(0.0f, 0.0f, 0.0f, 1.0f);
		glClear(GL_COLOR_BUFFER_BIT);

		glUniform2f(uid_resolution, WIDTH, HEIGHT);
		glUniform1f(uid_time, time);
		glDrawArrays(GL_TRIANGLES, 0, 6);

		SDL_GL_SwapWindow(window);

		time += 0.1f;
	}

	SDL_GL_DeleteContext(glcontext);
	SDL_DestroyWindow(window);
	SDL_Quit();

	return 0;
}
