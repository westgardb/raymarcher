#include <stdio.h>
#include <GL/glew.h>

#include "debug.h"

void 
MessageCallback(GLenum source,
                GLenum type,
				GLuint id,
				GLenum severity,
				GLsizei length,
				const GLchar* message,
				const void* userParam )
{
	printf("GL CALLBACK: %s type = 0x%x, severity = 0x%x, message = %s\n",
	      ( type == GL_DEBUG_TYPE_ERROR ? "** GL ERROR **" : "" ), type, severity, message);
}
