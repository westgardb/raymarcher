#version 330 core

#define PI 3.141592

out vec4 FragColor;
in vec2 FragCoord;

uniform vec2 u_resolution;
uniform float u_time;

const float FOV = radians(70.0);

const int MAX_STEPS = 100;
const float MIN_DIST = 0.0;
const float MAX_DIST = 100.0;
const float EPSILON = 0.0001;

const vec3 color_background = vec3(0.0, 0.0, 0.0);
//const vec3 color_background = vec3(0.678, 0.847, 0.902);

const vec3 color_ambient  = vec3(0.40, 0.20, 0.10);
const vec3 color_diffuse  = vec3(0.80, 0.20, 0.20);
const vec3 color_specular = vec3(1.00, 0.70, 0.90);
const float shininess = 10.0;

const vec3 light_pos   = vec3(2.00, 2.00, 3.00);
//const vec3 light_color = vec3(0.30, 0.30, 0.80);
const vec3 light_color = vec3(255/255, 244/255, 229/255)/1.5;

const vec3 eye_pos = vec3(0.0, 0.0, 5.0);

float smin(float a, float b, float k)
{
	float h = max(k - abs(a-b), 0) / k;
	return min(a, b) - h*h*h*k*1.0/6.0;
}

float sphereSDF(vec3 p, float r)
{
	return length(p) - r;
}

float boxSDF(vec3 p, float size, float rounding)
{
	vec3 q = abs(p) - size;
	return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - rounding;
}

float sceneSDF(vec3 p)
{
	//float c = 8.0;
	//vec3 p1 = mod(p+0.5*c, c) - 0.5*c;
	//vec3 p2 = p1;
	vec3 p1 = p;
	vec3 p2 = p;

	p1.x += 0.8 * sin(0.2*u_time);
	//p1.y += 0.4 * cos(0.4*u_time);
	p1.y += 0.6;
	//p1.z += 0.1;

	p2.x += 0.8 * sin(0.2*u_time + PI);
	//p2.y += 0.4 * cos(0.4*u_time + PI);
	p2.y -= 0.5;
	//p2.z -= 0.1;

	const vec3 k = normalize(vec3(0.2, 0.1, 0.1));
	float theta = sin(0.3*u_time);
	p2 = p2*cos(theta) + cross(k, p2)*sin(theta) + k*dot(k, p2)*(1-cos(theta));

	float disp_rate = 0.6 * u_time;
	float displacement = sin(7.0 * p1.x + disp_rate) * cos(7.0 * p1.y + disp_rate) * sin(7.0 * p1.z + disp_rate) * 0.05;

	return smin(sphereSDF(p1, 0.6) + displacement, boxSDF(p2, 0.5, 0.0), 0.6);
}

float dist_to_surface(vec3 march_dir, float start, float end)
{
	float depth = start;
	for (int i = 0; i < MAX_STEPS; i++)
	{
		float dist = sceneSDF(eye_pos + depth * march_dir);
		if (dist < EPSILON) return depth;
		depth += dist;
		if(depth > end) return end;
	}
	return end;
}

vec3 ray_dir(vec2 resolution, vec2 coord)
{
	vec2 xy = coord - resolution/2.0;
	float z = resolution.y / tan(FOV/2.0);
	return normalize(vec3(xy, -z));
}

/*
Estimate the normal to the scene using the gradient of the scene's
SDF. Close points are sampled to estimate the partial derivatives.
*/
vec3 estimate_normal(vec3 p)
{
	return normalize(vec3(
		sceneSDF(vec3(p.x + EPSILON, p.y, p.z)) - sceneSDF(vec3(p.x - EPSILON, p.y, p.z)),
		sceneSDF(vec3(p.x, p.y + EPSILON, p.z)) - sceneSDF(vec3(p.x, p.y - EPSILON, p.z)),
		sceneSDF(vec3(p.x, p.y, p.z + EPSILON)) - sceneSDF(vec3(p.x, p.y, p.z - EPSILON))
	));
}

vec3 phong_contrib(vec3 p)
{
	vec3 N = estimate_normal(p);
	vec3 L = normalize(light_pos - p);
	vec3 V = normalize(eye_pos - p);
	vec3 R = normalize(reflect(-L, N));

	float dotLN = dot(L, N);
	float dotRV = dot(R, V);

	if(dotLN < 0.0) return color_background;
	if(dotRV < 0.0) return light_color * (color_diffuse * dotLN);

	return light_color * (color_diffuse * dotLN + color_specular * pow(dotRV, shininess));
}

vec3 phong_illumination(vec3 p)
{
	const vec3 ambient = vec3(0.5, 0.5, 0.5);
	vec3 color = ambient * color_ambient;
	color += phong_contrib(p);
	return color;
}

void main()
{
	//light_pos = vec3(4*sin(u_time/6.0), 2.0, 4*cos(u_time/6.0));

	vec2 pixelCoord = u_resolution * (FragCoord + 1.0)/2.0;
	vec3 dir = ray_dir(u_resolution, pixelCoord);
	float dist = dist_to_surface(dir, MIN_DIST, MAX_DIST);

	if(dist > MAX_DIST - EPSILON)
	{
		FragColor = vec4(0.0, 0.0, 0.0, 1.0);
		return;
	}

	vec3 color = phong_illumination(eye_pos + dist * dir);

	FragColor = vec4(color, 1.0);
}
