import pandas as pd
import geojson
import os

csv_path = r'/Users/nathan/Dev/cirque/cirque-data/problems/problems.csv'
geojson_path = r'/Users/nathan/Dev/cirque/cirque-data/circuits/circuits.geojson'

def csv_to_geojson():
    # Read the CSV file
    df = pd.read_csv(csv_path)

    # Filter out rows where 'order' is null
    df = df[df['order'].notnull()]
    
    # Get all unique pairs of color and subarea
    unique_pairs = df[['color', 'subarea']].drop_duplicates()
    
    if unique_pairs.empty:
        print("No unique pairs of color and subarea found in the data.")
        return

    # Check if the output file already exists
    if os.path.exists(geojson_path):
        with open(geojson_path, 'r') as f:
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
        coordinates = list(zip(filtered_df['lon'], filtered_df['lat']))

        # Create a LineString feature with properties
        line_feature = geojson.Feature(
            geometry=geojson.LineString(coordinates),
            properties={"color": color, "subarea": subarea}
        )

        # Update or add the new feature
        updated_features[(color, subarea)] = line_feature

    updated_feature_collection = geojson.FeatureCollection(list(updated_features.values()))

    # Write the updated GeoJSON to a file
    with open(geojson_path, 'w') as f:
        geojson.dump(updated_feature_collection, f)
    
    print(f"GeoJSON file updated successfully: {geojson_path}")

if __name__ == "__main__":
    csv_to_geojson()
