class Cell {
    constructor() {
        this._borders = {
            top: false,
            bottom: false,
            right: false,
            left: false,
        }
        this._text = ''

        const el = document.createElement('div')
        this._el = el

        el.classList.add('cell')
        this.color = 'black'
        this.borders = {
            top: false,
            bottom: false,
            left: false,
            right: false
        }
    }

    removeBorder(side) {
        this._borders[side] = false
        this._el.classList.remove(side + '-border')
    }

    set text(value) {
        this._text = value
        this._el.textContent = value
    }

    set color(value) {
        this._el.style.backgroundColor = value
    }

    set borders(value) {
        this._borders = value
        for (const side in this._borders) {
            if (this._borders[side]) {
                this._el.classList.add(side + '-border')
            } else {
                this._el.classList.remove(side + '-border')
            }
        }
    }

}

class Maze {
    constructor(n, m) {
        this._size = [n, m]
        this._cells = new Array(n * m).fill(0).map(_ => new Cell())
        const el = document.createElement('div')
        el.classList.add('table')
        this._el = el
        
        for (let j = 0; j < n; j++) {
            const row = document.createElement('div')
            row.classList.add('table-row')
            for(let i = 0; i < m; i++) {
                const cell = this._cells[i + j * m]
                row.appendChild(cell._el)
                const borders = {
                    top: true,
                    bottom: true,
                    left: true,
                    right: true
                }
                cell.borders = borders
            }
            el.appendChild(row)
        }
        
    }

    has(i, j) {
        return i >= 0 && j >= 0 && i < this._size[0] && j < this._size[1]
    }

    getCell(i, j) {
        return this._cells[j + this._size[1] * i]
    }

    removeBorder(from, to) {
        const di = to[0] - from[0];
        const dj = to[1] - from[1];
        if(di === 0 && dj === 1) {
            this.getCell(from[0], from[1]).removeBorder('right')
            this.getCell(to[0], to[1]).removeBorder('left')
        }

        if(di === 0 && dj === -1) {
            this.getCell(from[0], from[1]).removeBorder('left')
            this.getCell(to[0], to[1]).removeBorder('right')
        }

        if(di === 1 && dj === 0) {
            this.getCell(from[0], from[1]).removeBorder('bottom')
            this.getCell(to[0], to[1]).removeBorder('top')
        }

        if(di === -1 && dj === 0) {
            this.getCell(from[0], from[1]).removeBorder('top')
            this.getCell(to[0], to[1]).removeBorder('bottom')
        }
    }
}

class LabCreate {
    constructor(table, timeout) {
        this.table = table
        this.timeout = timeout
        this.listeners = {}
    }

    addListener(type, callback) {
        if (!this.listeners[type]) {
            this.listeners[type] = []
        }
        this.listeners[type].push(callback)
    }

    emit(type, payload) {
        console.log(type, payload)
        if(this.listeners[type]) {
            for(let cb of this.listeners[type]) {
                cb(payload)
            }
        }
    }

    id(i, j) {
        return i + '_' + j
    }

    wait(t) {
        return new Promise(res => setTimeout(res, t))
    }

    randDirs() {
        const dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]]
        const rms = new Array(dirs.length).fill(0).map((_, i) => [Math.random(), i])
        rms.sort(([v1, i1], [v2, i2]) => {
            if (v1 > v2) {
                [dirs[i1], dirs[i2]] = [dirs[i2], dirs[i1]]
            }
            return v1 - v2
        })
        return dirs
    }

    async run() {
        const marked = {}

        const stk = [[[0, 0], [0, 0]]]

        while (stk.length > 0) {
            
            const [curr, prev] = stk.pop()
            this.emit('curr', curr)

            
            if (!marked[this.id(curr)]) {
                this.emit('way',{
                    from: prev,
                    to: curr,
                })

                await this.wait(this.timeout)
                
                marked[this.id(curr)] = true;
                
                const dirs = this.randDirs()
                
                for(const dir of dirs) {
                    const next = [curr[0] + dir[0], curr[1] + dir[1]]
                    const nextId = this.id(next[0], next[1])

                    if (!marked[nextId] && this.table.has(next[0], next[1])) {
                        this.emit('in', next)
                        stk.push([next, curr])
                    }
                }
            }
            this.emit('out', curr)
        }

    }
}



const root = document.getElementById('root')
const h = document.body.clientHeight
const w = document.body.clientWidth
const table = new Maze(Math.ceil(h / 24), Math.ceil(w / 24))


const creater = new MazeCreate(table, 0)
creater.addListener('out', function(curr) {
    table.getCell(curr[0], curr[1]).color = 'yellow'
})

creater.addListener('way', function({from, to}) {
    table.removeBorder(from, to)
})
creater.run()

root.appendChild(table._el)