import pandas as pd

df = pd.read_csv("dataset.csv", na_values=['x', '..'])

df.dropna(how='any', inplace=True)
df.drop(labels=["Vector", "Coordinate"], axis=1, inplace=True)
df.rename(columns={"Ref_Date": "YEAR", "Value": "VALUE"}, inplace=True)

df.to_csv("formatted.csv", index=False)
