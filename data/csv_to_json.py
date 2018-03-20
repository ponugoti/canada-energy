import pandas as pd
from collections import defaultdict
import json

df = pd.read_csv("dataset.csv", na_values=['x', '..', '0.0'])
df.dropna(how='any', inplace=True)

# remove irrelevant columns from dataset
df.drop(labels=["Vector", "Coordinate"], axis=1, inplace=True)
df.reset_index(drop=True, inplace=True)

# normalize headers
df.rename(columns={"Ref_Date": "YEAR", "Value": "VALUE"}, inplace=True)

# remove 'primary energy' and 'secondary energy' descriptors
df.replace([", primary energy", ", secondary energy"], "", regex=True, inplace=True)

df.to_csv("formatted.csv", index=False)

# Make a Json object of all the data based on GEO
data = defaultdict(lambda: defaultdict(lambda: defaultdict(dict)))

for r in df.itertuples():
    data[r.GEO][r.FUEL][r.SUPPLY][r.YEAR] = r.VALUE

with open("dataset.json", mode='w') as f:
    f.write(json.dumps(data, indent=2))
