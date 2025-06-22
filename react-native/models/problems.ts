import { GeoJsonProperties } from "geojson";
import { Point } from "geojson";
import { Feature } from "geojson";
import { z } from 'zod';

// Zod schema for runtime validation
export const ProblemSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  grade: z.string().optional(),
  order: z.number().optional(),
  colorStr: z.string(),
  color: z.string(),
  description: z.string().optional(),
  line: z.array(z.array(z.number())),
  topo: z.string().optional(),
  subarea: z.string().optional(),
  coordinates: z.tuple([z.number(), z.number()]).optional(), // [longitude, latitude]
});

// Type inferred from schema
export type Problem = z.infer<typeof ProblemSchema>; 

export function createProblemFromFeature(feature: Feature<Point, GeoJsonProperties>): Problem | null {
  const properties = feature.properties || {};
  const name = properties.name?.toString();
  const topo = properties.topo?.toString();

  if (!name || !topo) return null;

  const coordinates = feature.geometry?.coordinates?.slice(0, 2) as [number, number];

  const order =
    typeof properties.order === 'number'
      ? properties.order
      : properties.order
        ? parseInt(properties.order.toString(), 10)
        : undefined;

  let line: number[][] = [];
  try {
    if (properties.line && typeof properties.line === 'string') {
      line = JSON.parse(properties.line);
    }
  } catch (error) {
    console.error('Failed to parse topo line coordinates:', error);
  }

  const problemData = {
    id: properties.id?.toString() || Date.now().toString(),
    name,
    grade: properties.grade?.toString(),
    order,
    colorStr: properties.color?.toString() || '',
    color: getColorFromString(properties.color?.toString()),
    description: properties.description?.toString(),
    line,
    topo,
    subarea: properties.subarea?.toString(),
    coordinates,
  };

  // Validate the data using Zod schema
  try {
    return ProblemSchema.parse(problemData);
  } catch (error) {
    console.error('Problem validation failed:', error);
    return null;
  }
};

function getColorFromString(colorString?: string): string {
  switch (colorString) {
    case 'blue':
      return '#3B82F6';
    case 'white':
      return '#FFFFFF';
    case 'red':
      return '#EF4444';
    case 'orange':
      return '#F97316';
    case 'yellow':
      return '#FACC15';
    case 'black':
      return '#000000';
    default:
      return '#000000';
  }
};