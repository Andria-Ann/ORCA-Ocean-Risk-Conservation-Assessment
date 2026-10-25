
import pandas as pd
import matplotlib.pyplot as plt
from pathlib import Path
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score

# File locations
input_file = Path("output/cleaned_data.csv")
output_folder = Path("output")
output_folder.mkdir(exist_ok=True)

# Load cleaned dataset
df = pd.read_csv(input_file)

production = "Global plastics production (million tonnes)"

# Scale the production values
scaler = StandardScaler()
X_scaled = scaler.fit_transform(df[[production]])

# Elbow method: compare different cluster counts
inertias = []
silhouette_scores = []
k_values = range(2, 7)

for k in k_values:
    model = KMeans(n_clusters=k, random_state=42, n_init=10)
    labels = model.fit_predict(X_scaled)

    inertias.append(model.inertia_)
    silhouette_scores.append(silhouette_score(X_scaled, labels))

# Save elbow graph
plt.figure(figsize=(8, 5))
plt.plot(list(k_values), inertias, marker="o")
plt.title("Elbow Method for K-means Clustering")
plt.xlabel("Number of Clusters (K)")
plt.ylabel("Inertia")
plt.grid(True)
plt.tight_layout()
plt.savefig(output_folder / "elbow_method.png", dpi=300)
plt.show()

# Use 3 clusters to represent lower, medium, and higher production
kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
df["Cluster_ID"] = kmeans.fit_predict(X_scaled)

# Name clusters according to their production centers
centers = scaler.inverse_transform(
    kmeans.cluster_centers_
).flatten()

sorted_ids = centers.argsort()
names = ["Low Production", "Medium Production", "High Production"]

cluster_names = {
    cluster_id: names[rank]
    for rank, cluster_id in enumerate(sorted_ids)
}

df["Production_Cluster"] = df["Cluster_ID"].map(cluster_names)

# Save clustered dataset
df.to_csv(output_folder / "clustered_data.csv", index=False)

# Plot production over time by cluster
plt.figure(figsize=(10, 5))

for name in names:
    group = df[df["Production_Cluster"] == name]
    plt.scatter(group["Year"], group[production], label=name)

plt.title("K-means Clustering of Global Plastics Production")
plt.xlabel("Year")
plt.ylabel("Production (million tonnes)")
plt.legend()
plt.grid(True)
plt.tight_layout()
plt.savefig(output_folder / "production_clusters.png", dpi=300)
plt.show()

# Display results
print("\nClustered dataset shape:", df.shape)

print("\nProduction cluster counts:")
print(df["Production_Cluster"].value_counts())

print("\nAverage production by cluster:")
print(df.groupby("Production_Cluster")[production].mean())

print("\nSilhouette scores:")
for k, score in zip(k_values, silhouette_scores):
    print(f"K = {k}: {score:.3f}")

print("\nFiles saved successfully:")
print("- output/elbow_method.png")
print("- output/production_clusters.png")
print("- output/clustered_data.csv")
