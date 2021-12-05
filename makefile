# define the compiler
CC = gcc

# compiler flags
CCFLAGS = -Wall -Wextra -g

# library linker flags
LDFLAGS = -lSDL2 -lGL -lGLEW

# build directory
BUILDDIR = build

# target output executable
TARGET = main

# source c files
SRCS = main.c debug.c

# object files
OBJS = $(addprefix $(BUILDDIR)/, $(SRCS:.c=.o))

# build targets
default: $(TARGET)

$(TARGET): $(OBJS)
	$(CC) $(CCFLAGS) -o $(TARGET) $(OBJS) $(LDFLAGS)

$(BUILDDIR)/main.o: main.c debug.c debug.h
	$(CC) $(CCLAGS) -c main.c -o $@

$(BUILDDIR)/debug.o: debug.c debug.h
	$(CC) $(CCFLAGS) -c debug.c -o $@
