import pandas as pd
from collections import defaultdict
import json

def clean_up_csv():
    df = pd.read_csv("dataset.csv", na_values=['x', '..', '0.0'])
    df.dropna(how='any', inplace=True)

    df.drop(labels=["Vector", "Coordinate"], axis=1, inplace=True)
    df.reset_index(drop=True, inplace=True)
    df.rename(columns={"Ref_Date": "YEAR", "Value": "VALUE"}, inplace=True)
    df.replace([", primary energy", ", secondary energy"],"", regex=True, inplace=True)

    return df

def export_location_based_json(df):
    # Make a Json object of all the data based on GEO
    data = defaultdict(lambda: defaultdict(lambda: defaultdict(dict)))

    for r in df.itertuples():
        data[r.GEO][r.FUEL][r.SUPPLY][r.YEAR] = r.VALUE

    with open("dataset.json", mode='w') as f:
        f.write(json.dumps(data, indent=2))

def export_year_based_json(df):
    # Make a Json object of all the data based on GEO
    data = defaultdict(lambda: defaultdict(lambda: defaultdict(dict)))

    for r in df.itertuples():
        data[r.GEO][r.FUEL][r.SUPPLY][r.YEAR] = r.VALUE

    with open("dataset.json", mode='w') as f:
        f.write(json.dumps(data, indent=2))

if __name__ == '__main__':
    df = clean_up_csv()

    # df.drop(df[df.YEAR != 1995].index, inplace=True)
    # df.drop(df[df.GEO != "Canada"].index, inplace=True)
    # df.drop(labels=["GEO", "YEAR"], axis=1, inplace=True)

    values = [r.VALUE for r in df.itertuples()]
    df.drop(labels=["VALUE"], axis=1, inplace=True)
    df.to_csv("formatted.csv", index=False)
    df.to_csv("hyphened.csv", index=False, sep='-')

    with open("hyphened.csv", 'r') as f:
        lines = ["".join([line.strip(), ",", str(val), "\n"]) for line, val in zip(f.readlines(), values)]

    with open("hyphened.csv", 'w') as f:
        f.writelines(lines)

    # export_location_based_json(df)
