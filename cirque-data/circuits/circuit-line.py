import pandas as pd
import geojson
import os

geojson_path_problems = r'/Users/nathan/Dev/cirque/cirque-data/problems/problems.geojson'
geojson_path_circuits = r'/Users/nathan/Dev/cirque/cirque-data/circuits/circuits.geojson'

def update_circuit_lines():
    # Read the input GeoJSON file
    with open(geojson_path_problems, 'r') as f:
        problems_geojson = geojson.load(f)

    # Convert the GeoJSON features to a DataFrame
    features = problems_geojson['features']
    properties_list = [feature['properties'] for feature in features]
    coordinates_list = [feature['geometry']['coordinates'] for feature in features]

    df = pd.DataFrame(properties_list)
    df['coordinates'] = coordinates_list

    # Filter out rows where 'order' is null or an empty string
    df = df[df['order'].notnull() & (df['order'] != '')]

    # Ensure 'order' is of numeric type
    df['order'] = pd.to_numeric(df['order'])

    # Get all unique pairs of color and subarea
    unique_pairs = df[['color', 'subarea']].drop_duplicates()

    if unique_pairs.empty:
        print("No unique pairs of color and subarea found in the data.")
        return

    # Check if the output file already exists
    if os.path.exists(geojson_path_circuits):
        with open(geojson_path_circuits, 'r') as f:
            existing_geojson = geojson.load(f)
    else:
        existing_geojson = geojson.FeatureCollection([])

    # Create a dictionary to hold updated features
    updated_features = {tuple(feature['properties'].values()): feature for feature in existing_geojson['features']}

    # Iterate over each unique pair
    for _, row in unique_pairs.iterrows():
        color = row['color']
        subarea = row['subarea']

        # Filter the dataframe based on color and subarea
        filtered_df = df[(df['color'] == color) & (df['subarea'] == subarea)]

        if filtered_df.empty:
            print(f"No data found for color '{color}' and subarea '{subarea}'")
            continue

        # Sort the filtered dataframe by the 'order' column
        filtered_df = filtered_df.sort_values(by='order')

        # Extract the coordinates
        coordinates = [coord for coord in filtered_df['coordinates']]

        # Create a LineString feature with properties
        line_feature = geojson.Feature(
            geometry=geojson.LineString(coordinates),
            properties={"color": color, "subarea": subarea}
        )

        # Update or add the new feature
        updated_features[(color, subarea)] = line_feature

    updated_feature_collection = geojson.FeatureCollection(list(updated_features.values()))

    # Write the updated GeoJSON to a file
    with open(geojson_path_circuits, 'w') as f:
        geojson.dump(updated_feature_collection, f)

    print(f"GeoJSON file updated successfully: {geojson_path_circuits}")

if __name__ == "__main__":
    update_circuit_lines()
