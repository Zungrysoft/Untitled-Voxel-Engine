# This code converts from .vox to structure .json format

import struct
import json
import os

def read_int(file):
    return struct.unpack('<i', file.read(4))[0]

def write_int(file, value):
    file.write(struct.pack('<i', value))

def read_vox_file(filename):
    size_x, size_y, size_z = None, None, None
    voxels = []

    with open(filename, 'rb') as file:
        if file.read(4) != b'VOX ':
            raise ValueError("Invalid .vox file format")

        if read_int(file) != 150:
            raise ValueError("Unsupported .vox version")

        # Read MAIN chunk header
        main_chunk_id, main_chunk_content_size, main_chunk_children_size = struct.unpack('<4sII', file.read(12))
        assert main_chunk_id == b'MAIN', f"Invalid MAIN chunk ID: {main_chunk_id}"
        main_chunk_end = file.tell() + main_chunk_children_size

        size_x, size_y, size_z = 0, 0, 0
        voxels = []

        # Process child chunks
        while file.tell() < main_chunk_end:
            chunk_id, chunk_content_size, chunk_children_size = struct.unpack('<4sII', file.read(12))
            if chunk_id == b'SIZE':
                size_x, size_y, size_z = struct.unpack('<3I', file.read(chunk_content_size))
            elif chunk_id == b'XYZI':
                num_voxels, = struct.unpack('<I', file.read(4))
                voxels = [struct.unpack('<4B', file.read(4)) for _ in range(num_voxels)]
            else:
                # Ignore unsupported chunk and move to the next one
                file.seek(chunk_content_size + chunk_children_size, os.SEEK_CUR)

    return size_x, size_y, size_z, voxels

def index_to_material(index):
    mapping = [
        "structure",
        "structure",
        "grass",
        "leaves",
        "vines",
        "fruit",
        "flower",
        "bark",
        "wood",
        "dirt",
        "sand",
        "stone",
        "stoneAccent",
        "stoneAccent2",
        "stoneRoof",
        "metal",
        "metalAccent",
        "sign",
        "signText",
        "bone",
        "rune",
        "crystal",
    ]
    if index < len(mapping) and index >= 0:
        return mapping[index]
    else:
        return "structure"

def convert_vox_to_json(input_filename, output_filename):
    # Read vox file data
    size_x, size_y, size_z, voxels = read_vox_file(input_filename)

    # Read existing output file data
    data = {}
    with open(output_filename, 'r') as output_file:
        data = json.load(output_file)

    # Put new voxel data into structure
    data["voxels"] = {}
    voidVoxels = set()
    for x, y, z, color_index in voxels:
        voxelKey = f"{x},{(size_y-1)-y},{z}"
        if color_index == 255:
            voidVoxels.add(voxelKey)
        else:
            data["voxels"][voxelKey] = {
                "material": index_to_material(color_index),
                "solid": True,
            }

    # If we're in useVoid mode, fill all available voxels with air unless they have index 255
    if "useVoid" in data and data["useVoid"]:
        for x in range(size_x):
            for y in range(size_y):
                for z in range(size_z):
                    voxelKey = f"{x},{(size_y-1)-y},{z}"
                    if not (voxelKey in data["voxels"]) and not (voxelKey) in voidVoxels:
                        data["voxels"][voxelKey] = {
                            "solid": False,
                        }

    with open(output_filename, 'w') as output_file:
        json.dump(data, output_file, indent=4)

if __name__ == '__main__':
    import sys

    if len(sys.argv) != 3:
        print(f'Usage: {sys.argv[0]} input.vox output.vox')
        sys.exit(1)

    input_filename, output_filename = sys.argv[1], sys.argv[2]

    convert_vox_to_json(input_filename, output_filename)
