import pandas as pd
import geojson
import os
import sys

def csv_to_geojson(csv_file, color, subarea, output_file):
    # Read the CSV file
    df = pd.read_csv(csv_file)
    
    # Filter the dataframe based on color and subarea
    filtered_df = df[(df['color'] == color) & (df['subarea'] == subarea)]
    
    if filtered_df.empty:
        print(f"No data found for color '{color}' and subarea '{subarea}'")
        return

    # Extract the coordinates
    coordinates = list(zip(filtered_df['lon'], filtered_df['lat']))

    # Create a LineString feature with properties
    line_feature = geojson.Feature(
        geometry=geojson.LineString(coordinates),
        properties={"color": color, "subarea": subarea}
    )

    # Check if the output file already exists
    if os.path.exists(output_file):
        with open(output_file, 'r') as f:
            existing_geojson = geojson.load(f)
    else:
        existing_geojson = geojson.FeatureCollection([])

    # Update or add the new feature
    updated_features = []
    feature_found = False
    for feature in existing_geojson['features']:
        if feature['properties'].get('color') == color and feature['properties'].get('subarea') == subarea:
            updated_features.append(line_feature)
            feature_found = True
        else:
            updated_features.append(feature)

    if not feature_found:
        updated_features.append(line_feature)

    updated_feature_collection = geojson.FeatureCollection(updated_features)

    # Write the updated GeoJSON to a file
    with open(output_file, 'w') as f:
        geojson.dump(updated_feature_collection, f)
    
    print(f"GeoJSON file updated successfully: {output_file}")

if __name__ == "__main__":
    if len(sys.argv) != 5:
        print("Usage: python script.py <csv_file> <color> <subarea> <output_file>")
    else:
        csv_file = sys.argv[1]
        color = sys.argv[2]
        subarea = sys.argv[3]
        output_file = sys.argv[4]
        csv_to_geojson(csv_file, color, subarea, output_file)
